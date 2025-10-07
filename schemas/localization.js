import mongoose, {Schema} from "mongoose";

const localizationSchema = new Schema({
    key: { type: String, required: true, index: true }, // Usually, there will be english version of it
    translations: {
        type: Map,
        of: String // {en: str, ru: str, uz: str}
    },
    status: {
        type: String,
        required: true,
        enum: [
            "needs-review", // Usually when localization is new it requires a review (adding ru and uz)
            "needs-review-after-changes",
            "approved"
        ],
        default: "needs-review"
    }
}, {
    timestamps: true
});

export default mongoose.model("Localization", localizationSchema);
