/* eslint-disable @next/next/no-head-element */
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { settings } from "~/settings.mjs";
import nodemailer from 'nodemailer'
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { getReportContent } from "~/lib/reports/reports";
import dayjs from "dayjs";
import metadata from "~/lib/metadata";

const config: SMTPTransport.Options | SMTPTransport = {
    host: env.SMTP_HOST,
    port: (env.SMTP_PORT && Number.isFinite(parseInt(env.SMTP_PORT || 'NaN'))) ? parseInt(env.SMTP_PORT) : 587,
    secure: env.SMTP_USE_SSL === 'true' || env.SMTP_USE_SSL === 'on' || env.SMTP_USE_SSL === 'yes',
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    service: env.NODEMAILER_SMTP_SERVICE || 'Outlook365',
}

const transporter = nodemailer.createTransport(config);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // await metadata.clearAll()
    // return

    const envDR = env.DAILY_REPORTS?.toLowerCase().trim();
    const enabled = envDR === 'true' || envDR === 'on' || envDR === 'yes'
    const token = env.CRON_JOB_TOKEN || env.NEXTAUTH_SECRET || ''
    if (!enabled) {
        res.status(404).json("Not Found")
        return;
    }
    const authorization = req.headers.authorization
    const requestToken = authorization?.split(' ')[1]
    if (requestToken !== token) {
        res.status(401).json("Unauthorized")
        return;
    }

    const emails = await settings.getReportToEmails()

    if (emails.length === 0) {
        console.log("No emails to send report to")
        return res.json(false);
    }

    const from = env.SMTP_FROM_EMAIL || env.SMTP_USER

    if (!from) {
        console.log("No from email")
        return res.json(false);
    }

    function sendEmail({ subject, content }: EmailData) {
        const x = transporter.sendMail({
            to: emails.join(','),
            from: `${(env.SMTP_FROM_NAME || env.SMTP_USER || 'Reportes')} <${from || ''}>`,
            subject: subject,
            html: content
        })

        console.log("Email sent to", emails.join(','), "with subject", subject)

        return x
    }


    const dailyReport = await getDailyReportEmail()

    if (dailyReport) {
        await sendEmail(dailyReport)
        await metadata.set('lastDailyReport', new Date().toISOString())
    }

    const studnetsAlerts = await getWeeklyStudentSpecificReports()
    await Promise.all(studnetsAlerts.map(sendEmail))
    await metadata.set('lastStudentSpecificDailyReport', new Date().toISOString())

    const acumulativeReports = await acumulativeReport()
    await Promise.all(acumulativeReports.map(sendEmail))
    await metadata.set('lastAcumulativeReport', new Date().toISOString())

    res.json(true);
}

async function getDailyReportEmail(): Promise<EmailData | null> {
    const lastDailyReportStr = await metadata.get('lastDailyReport')
    const lastDailyReport = lastDailyReportStr ? new Date(lastDailyReportStr) : null

    const todaysCommunicationsRaw = await prisma.communication.findMany({
        where: {
            timestamp: {
                gte: lastDailyReport || new Date(new Date().setHours(0, 0, 0, 0))
            },
        }
    })

    // Don't send report if there are no communications and the last report was sent today
    if (todaysCommunicationsRaw.length === 0 && dayjs(lastDailyReport).isAfter(dayjs().startOf('day'))) {
        return null
    }

    return {
        content: await getReportContent(null, todaysCommunicationsRaw),
        subject: "Reporte diario de comunicaciones",
    }
}

interface EmailData {
    subject: string
    content: string
}

async function getWeeklyStudentSpecificReports(): Promise<EmailData[]> {
    const lastStudentSpecificDailyReportStr = await metadata.get('lastStudentSpecificDailyReport')
    const lastStudentSpecificDailyReport = lastStudentSpecificDailyReportStr ? new Date(lastStudentSpecificDailyReportStr) : null

    const thisWith = dayjs().startOf('week').toDate()

    const communications = await prisma.communication.findMany({
        where: {
            timestamp: {
                gte: ((thisWith.valueOf() > (lastStudentSpecificDailyReport?.valueOf() || 0)) ? lastStudentSpecificDailyReport : thisWith) || thisWith
            },
        }
    })

    const byStudent = new Map<string, typeof communications>()
    for (const communication of communications) {
        byStudent.set(communication.studentEnrolment, byStudent.get(communication.studentEnrolment)?.concat(communication) || [communication])
    }

    const result: EmailData[] = []

    for (const enrolment of byStudent.keys()) {
        const communications = byStudent.get(enrolment)

        if (!communications) continue

        if (communications.length >= 3) {

            let communicationsBeforLast = 0

            // The idea is to prevent email duplication
            for (const communication of communications) {
                if (communication.timestamp.valueOf() < (lastStudentSpecificDailyReport || thisWith).valueOf()) {
                    communicationsBeforLast++
                }
            }

            // If already sent 3 or more communications before the last report, don't send another one
            // Unless there are more than 6 communications, then send another one
            if (communicationsBeforLast >= 3 && communications.length < 6) continue

            result.push({
                subject: `Segunda alerta: ${communications.length} comunicaciones de ${enrolment}`,
                content: await getReportContent(<>
                    <h1>Alerta {communications.length} comunicaciones de {enrolment}</h1>
                    <p>El estudiante {communications[0]?.studentEnrolment} registró {communications.length} en la última semana al día {dayjs().format('DD/MM/YYYY')}</p>
                </>, communications)
            })
        }
    }

    return result
}

async function acumulativeReport(): Promise<EmailData[]> {
    const lastAcumulativeReportStr = await metadata.get('lastAcumulativeReport')
    const lastAcumulativeReport = lastAcumulativeReportStr ? new Date(lastAcumulativeReportStr) : null
    const startOfYear = dayjs().startOf('year').toDate()
    const year = startOfYear.getFullYear()

    const allCommunications = await prisma.communication.findMany({
        where: {
            timestamp: {
                gte: startOfYear
            }
        }
    })
    const byStudent = new Map<string, typeof allCommunications>()
    for (const communication of allCommunications) {
        byStudent.set(communication.studentEnrolment, byStudent.get(communication.studentEnrolment)?.concat(communication) || [communication])
    }

    const result: EmailData[] = []

    for (const [student, communications] of byStudent.entries()) {
        const byMessage = new Map<string, typeof allCommunications>()
        for (const communication of communications) {
            byMessage.set(communication.message, byMessage.get(communication.message)?.concat(communication) || [communication])
        }

        for (const [message, communications] of byMessage.entries()) {

            // console.log("Checking", student, message, communications.length)

            const metaKey = `lastAcumulativeReport-${year}-${student}-${message}`
            const alreadySentOfStudent = (await metadata.getAsInt(metaKey)) || 0

            // console.log("Already sent", alreadySentOfStudent)

            if ((communications.length - alreadySentOfStudent) >= 3) {
                await metadata.setInt(metaKey, communications.length)
                result.push({
                    subject: `Alerta acumulativa: ${communications.length} comunicaciones de ${student}`,
                    content: await getReportContent(<>
                        <h1>Alerta acumulativa {communications.length} comunicaciones de {student}</h1>
                        <p>El estudiante {student} registró {communications.length} comunicaciones en el año {year} con el mismo mensaje</p>
                        <pre style={{ backgroundColor: 'rgba(127,127,127,0.2)', padding: '3px' }}>
                            {message}
                        </pre>
                    </>, communications)
                })
            }
        }
    }

    return result
}