/* eslint-disable @next/next/no-head-element */
import type { Communication } from "@prisma/client";
import dayjs from "dayjs";
import * as ReactDOM from 'react-dom/server'
import { prisma } from "~/server/db";
import { settings } from "~/settings.mjs";


export async function getReportContent(body: React.ReactNode, _communications: Communication[]) {
    const communications = await Promise.all(_communications.map(async communication => {
        return {
            ...communication,
            student: await settings.getStudentByEnrolment(communication.studentEnrolment),
            teacher: await settings.getTeacher(communication.teacherEmail),
        }
    }))

    const bgs = [
        'rgba(127, 127, 127, 0.1)',
        'rgba(127, 127, 127, 0.2)',
    ]

    return ReactDOM.renderToString(<html lang="es">
        <head>
            <meta charSet="utf-8" />
            <title>Reporte de comunicaciones</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
                {`   
                * {
                    font-family: sans-serif;
                    box-sizing: border-box;
                }

                p {
                    padding: 0;
                    margin: 0;
                    text-overflow: ellipsis;
                }

                a {
                    text-decoration: none;
                    display: block;
                    color: #0284c7;
                }
                `}
            </style>
        </head>
        <body>
            {!body && <p>Se han registrado {communications.length} comunicaciones el día {dayjs().format('DD/MM/YYYY')}</p>}
            {body}
            {communications.length > 0 && <div>
                <h2>Comunicaciones</h2>
                {communications.map((communication, i) => {
                    return <a key={i} style={{ backgroundColor: bgs[i % 2], padding: '10px', whiteSpace: 'nowrap', overflow: 'hidden' }} href={"https://comunicaciones.henryford.edu.ar/comunicaciones/" + communication.id}>
                        <p style={{ fontWeight: 'bold', fontSize: '18px', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden' }}>{communication.teacher?.name || communication.teacherEmail} &rarr; {communication.studentEnrolment} - {communication.student?.name}</p>
                        <p style={{ padding: '2px 0', whiteSpace: 'nowrap' }}>{communication.message} &rarr; {communication.action_taken}</p>
                        <p style={{ fontSize: '14px' }}>{communication.comment}</p>
                        <p style={{ fontSize: '14px' }}>{communication.student?.coursingYear}° año - {communication.subjectCode}</p>
                    </a>
                })}
            </div>}
        </body>
    </html>)
}