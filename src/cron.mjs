import { CronJob } from 'cron';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv'

dotenv.config()

const DEFAULT_SCHEDULE = '0 0 8,15 * * 1-5'

const job = new CronJob(process.env.CRON_JOB_SCHEDULE ?? DEFAULT_SCHEDULE, () => {
    console.log('Running cron job')
    
    const token = process.env.CRON_JOB_TOKEN || process.env.NEXTAUTH_SECRET || ''
    const url = process.env.CRON_JOB_URL ?? (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000') + '/api/cron'

    fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    }).catch((err) => {
        console.log("Failed to run cron job")
        console.error(err)
    })
})

job.start()
