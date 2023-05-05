/* eslint-disable @next/next/no-head-element */
import type { NextApiRequest, NextApiResponse } from "next";
import { getReportContent } from "~/lib/reports/reports";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // res.send(await getReportContent())
}