import privateHandler from "./private/privateHandler.js";

export default function messageHandler(msg) {
    console.log(msg);

    const type = msg.chat.type;
    if (type === "private") return privateHandler(msg);

    console.log("Something else");
};