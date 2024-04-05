import { NextApiRequest, NextApiResponse } from "next";
import { settings } from "~/settings.mjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const file = req.query.file as string

    if(!/^([a-zA-Z0-9\_\-]+\.)*[a-zA-Z0-9\_\-]+$/.test(file)) {
        return res.status(400).json({ error: "Invalid filename" })
    }

    res.json(await settings.getFile(file))
}
