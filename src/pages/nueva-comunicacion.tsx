import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { useRouter } from "next/router";
import Select from "~/lib/components/Select";
import { useQueryState } from "next-usequerystate";
import { useState } from "react";

const Home: NextPage = () => {
    const router = useRouter()

    // const courseYear = parseInt(router.query.curso?.toString() || 'NaN') || null
    const [_courseYear, _setCourseYear] = useQueryState('curso')
    const [enrolment, setEnrolment] = useQueryState('enrolment')
    const [subjectCode, setSubjectCode] = useQueryState('materia')

    const courseYear = parseInt(_courseYear || 'NaN') || null
    const setCourseYear = (value: string | number) => _setCourseYear(value.toString())

    const { data: courses } = api.getCourses.useQuery()
    const { data: student } = api.getStudent.useQuery(enrolment || '', { enabled: !!enrolment })
    const { data: subject } = api.getSubject.useQuery(subjectCode || '', { enabled: !!subjectCode })
    const { data: students } = api.getStudentsOf.useQuery(courseYear || 0, { enabled: !!courseYear })
    const { data: subjects } = api.getSubjectsOfYear.useQuery(courseYear || 0, { enabled: !!courseYear })
    const { data: messages } = api.getMessages.useQuery()
    const { mutateAsync: saveCommunication } = api.createCommunication.useMutation()

    const studentsOptions = students?.map(student => ({ label: `${student.enrolment} | ${student.name}`, value: student.enrolment })) || []
    const coursesOptions = courses?.map(course => ({ label: `${course.label}`, value: course.year })) || []
    const subjectsOptions = subjects?.map(subject => ({ label: `${subject.name}`, value: subject.code })) || []
    const messagesOptions = messages?.map(message => ({ label: `${message}`, value: message })) || []

    const [timestamp, setTimestamp] = useState(new Date())
    const [message, setMessage] = useState('')
    const [comment, setComment] = useState('')

    function setDate(year: number, month: number, day: number) {
        const date = new Date(timestamp)
        date.setFullYear(year)
        date.setMonth(month)
        date.setDate(day)
        setTimestamp(date)
    }

    function setTime(hours: number, minutes: number) {
        const date = new Date(timestamp)
        date.setHours(hours)
        date.setMinutes(minutes)
        setTimestamp(date)
    }

    let time = timestamp.toISOString().split('T')[1]?.split('.')[0]
    // remove seconds from time
    if (time) time = time.split(':').slice(0, 2).join(':') + ':00'

    const menu = [
        { label: 'Inicio', href: '/' },
    ]

    if (subject && subjectCode && subject.courseYear === courseYear) {
        menu.push({ label: subject.name, href: courseYear ? `/materia/${subjectCode}?curso=${courseYear.toString()}` : `/materia/${subjectCode}` })
    }

    const [loading, setLoading] = useState(false)

    const ready = message && subject && student && timestamp

    function save() {
        if(!ready || loading) return
        setLoading(true)
        saveCommunication({
            subject: subjectCode || '',
            timestamp: timestamp,
            message: message,
            comment: comment,
            student: student?.enrolment || '',
        }).then(() => {
            setLoading(false)
            void router.push('/mis-comunicaciones')
        }).catch(() => {
            setLoading(false)
        })
    }

    return (
        <>
            <Head>
                <title>Cuaderno de comunicados</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Layout
                title="Inicio"
                menu={menu}
                nav={[]}
            >
                <label className="text-sm mt-2">Curso</label>
                <Select
                    value={courseYear || 0}
                    options={coursesOptions}
                    onChange={value => setCourseYear(value.toString())}
                />
                <label className="text-sm mt-2">Estudiante</label>
                <Select
                    value={enrolment || ''}
                    options={studentsOptions}
                    onChange={value => setEnrolment(value.toString())}
                />
                <label className="text-sm mt-2">Materia</label>
                <Select
                    value={subjectCode || ''}
                    options={subjectsOptions}
                    onChange={value => setSubjectCode(value.toString())}
                />
                <label className="text-sm mt-2">Hora</label>
                <input type="time" className="border rounded-md px-2 py-1"
                    value={time}
                    onChange={e => {
                        const [hours, minutes] = e.target.value.split(':').map(Number)
                        if (hours === undefined) return
                        if (minutes === undefined) return
                        setTime(hours, minutes)
                    }}
                />
                <label className="text-sm mt-2">Fecha</label>
                <input type="date" className="border rounded-md px-2 py-1"
                    value={timestamp.toISOString().split('T')[0]}
                    onChange={e => {
                        const [year, month, day] = e.target.value.split('-').map(Number)
                        if (year === undefined) return
                        if (month === undefined) return
                        if (day === undefined) return
                        setDate(year, month, day)
                    }}
                />
                <label className="text-sm mt-2">Motivo</label>
                <Select
                    value={message}
                    options={messagesOptions}
                    onChange={value => setMessage(value.toString())}
                />
                <label className="text-sm mt-2">Comentario interno</label>
                <textarea
                    name=""
                    rows={3}
                    className="border rounded-md px-2 py-1"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                ></textarea>
                {(
                    ready
                ) && <button type="button"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md mt-3"
                    disabled={loading}
                    onClick={save}
                >
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>}
            </Layout>
        </>
    );
};

export default Home