import asyncio
import logging
import os
import shlex
import subprocess
from typing import Optional
from dotenv import load_dotenv

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (Application, CallbackQueryHandler, CommandHandler,
                          ContextTypes)


# Configure logging early so we see startup issues
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("pm2-ctl-bot")


# Load environment from .env if present (does not override existing env)
load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"), override=False)

PM2_PROCESS_NAME = os.environ.get("PM2_PROCESS_NAME", "dringo-lite")
PM2_START_COMMAND = os.environ.get("PM2_START_COMMAND", "").strip()
# Security: set ALLOWED_USER_IDS to a comma-separated list of Telegram user IDs
# Example: export ALLOWED_USER_IDS="123456789,987654321"
_allowed_ids_raw = os.environ.get("ALLOWED_USER_IDS", "").strip()
ALLOWED_USER_IDS = {
    int(x) for x in _allowed_ids_raw.split(",") if x.strip().isdigit()
} if _allowed_ids_raw else set()


def _user_allowed(update: Update) -> bool:
    if not ALLOWED_USER_IDS:
        # If unset, allow everyone (not recommended for production)
        return True
    user = update.effective_user
    return user is not None and user.id in ALLOWED_USER_IDS


def _pm2_cmd(action: str) -> list[str]:
    if action not in {"start", "stop", "restart", "status"}:
        raise ValueError("Invalid PM2 action")
    if action == "status":
        # status is informational
        return [f"pm2 status {shlex.quote(PM2_PROCESS_NAME)}"]
    if action == "start":
        if PM2_START_COMMAND:
            return [PM2_START_COMMAND]
        # Default start command requested by user
        return [
            f"pm2 start index.js --name {shlex.quote(PM2_PROCESS_NAME)} --watch"
        ]
    return [f"pm2 {action} {shlex.quote(PM2_PROCESS_NAME)}"]


async def _run_shell_command(command: str, timeout: int = 20) -> tuple[int, str, str]:
    """Run a command inside a login bash shell so user env (nvm/pm2) is loaded."""
    # Using bash -lc ensures profile scripts run, making pm2 available in PATH
    wrapped = ["bash", "-lc", command]
    logger.info("Executing: %s", command)
    proc = await asyncio.create_subprocess_exec(
        *wrapped,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout_b, stderr_b = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return 124, "", "Command timed out"
    return proc.returncode, stdout_b.decode(errors="replace"), stderr_b.decode(errors="replace")


def _main_menu() -> InlineKeyboardMarkup:
    buttons = [
        [
            InlineKeyboardButton(text="▶️ Start", callback_data="start"),
            InlineKeyboardButton(text="⏹ Stop", callback_data="stop"),
        ],
        [InlineKeyboardButton(text="ℹ️ Status", callback_data="status")],
    ]
    return InlineKeyboardMarkup(buttons)


async def start_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not _user_allowed(update):
        await update.effective_message.reply_text("Unauthorized.")
        return
    await update.effective_message.reply_text(
        f"PM2 target: <b>{PM2_PROCESS_NAME}</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=_main_menu(),
    )


async def _handle_action(update: Update, context: ContextTypes.DEFAULT_TYPE, action: str) -> None:
    if not _user_allowed(update):
        if update.callback_query:
            await update.callback_query.answer("Unauthorized", show_alert=True)
        return

    display_action = action.capitalize()
    if update.callback_query:
        await update.callback_query.answer(f"{display_action} requested…")

    for cmd in _pm2_cmd(action):
        code, out, err = await _run_shell_command(cmd)
        text = (
            f"<b>$ {cmd}</b>\n"
            f"<b>exit:</b> {code}\n\n"
        )
        if out.strip():
            text += f"<b>stdout</b>\n<pre>{_escape_pre(out)}</pre>\n"
        if err.strip():
            text += f"<b>stderr</b>\n<pre>{_escape_pre(err)}</pre>\n"

        if update.callback_query:
            await update.callback_query.edit_message_text(
                text=text,
                parse_mode=ParseMode.HTML,
                reply_markup=_main_menu(),
                disable_web_page_preview=True,
            )
        else:
            await update.effective_message.reply_html(
                text=text,
                reply_markup=_main_menu(),
                disable_web_page_preview=True,
            )


def _escape_pre(s: str) -> str:
    # Minimal HTML escape for <pre>
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


async def on_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if not query:
        return
    action = query.data or ""
    if action not in {"start", "stop", "status"}:
        await query.answer("Unknown action")
        return
    await _handle_action(update, context, action)


def _get_token() -> Optional[str]:
    token = os.environ.get("BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN")
    return token


def main() -> None:
    token = _get_token()
    if not token:
        logger.error("BOT_TOKEN env var is required")
        raise SystemExit(1)

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CallbackQueryHandler(on_button))

    logger.info("Starting bot. PM2 process: %s", PM2_PROCESS_NAME)
    app.run_polling(close_loop=False)


if __name__ == "__main__":
    main()


