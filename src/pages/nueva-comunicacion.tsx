import AppBar from '~/lib/components/AppBar';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useRouter } from 'next/router';
import { useQueryState } from 'next-usequerystate';
import { api } from '~/utils/api';
import { useState } from 'react'
import { useMemo } from 'react'
import dayjs from 'dayjs';
import { nameInitials, stringAvatar, transformName } from '~/lib/util/nameUtils';
import { useUserRole } from '~/lib/util/useUserRole';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '~/lib/ProtectedRoute';



export default function NewCommunicationWrapper() {
    return <ProtectedRoute>
        <NewCommunication />
    </ProtectedRoute>
}

export function NewCommunication() {
    const router = useRouter()

    // const courseYear = parseInt(router.query.curso?.toString() || 'NaN') || null
    const [_courseYear, _setCourseYear] = useQueryState('curso')
    const [defaultEnrolment,] = useQueryState('matricula')
    const [subjectCode, setSubjectCode] = useQueryState('materia')

    const courseYear = parseInt(_courseYear || 'NaN') || null
    const setCourseYear = (value: string | number) => _setCourseYear(value.toString())

    const { data: courses } = api.getCourses.useQuery()
    const { data: subject } = api.getSubject.useQuery(subjectCode || '', { enabled: !!subjectCode })
    const { data: students } = api.getStudentsOf.useQuery(courseYear || 0, { enabled: !!courseYear })
    const { data: subjects } = api.getSubjectsOfYear.useQuery(courseYear || 0, { enabled: !!courseYear })
    const { data: messages } = api.getMessages.useQuery()
    const { mutateAsync: createCommunications } = api.createCommunications.useMutation()

    const role = useUserRole()
    const { data: session } = useSession()

    const [timestamp, setTimestamp] = useState(dayjs())
    const [message, setMessage] = useState('')
    const [comment, setComment] = useState('')
    const [action_taken, setActionTaken] = useState('')
    const [selectedStudents, setSelectedStudents] = useState<string[]>([])
    const filteredSelectedStudents = useMemo(() => {
        if (!students || !selectedStudents.length) return []
        return students.filter(student => selectedStudents.includes(student.enrolment))
    }, [students, selectedStudents])

    const filteredSubjectCode = useMemo(() => {
        if (!subjects || !subjectCode) return ''
        const subject = subjects.find(subject => subject.code === subjectCode)
        return subject?.code || null
    }, [subjects, subjectCode])

    // remove seconds from time


    const [loading, setLoading] = useState(false)

    const almostReady = message && filteredSubjectCode && filteredSelectedStudents?.length && timestamp
    const ready = almostReady && action_taken
    const missingStudent = message && filteredSubjectCode && timestamp

    const filteredSubjects = useMemo(() => {
        if (!subjects) return []
        return subjects.filter(subject => subject.courseYear === courseYear).map(subject => ({
            ...subject, isMine: role.isAdmin || subject?.teachers.includes(session?.user.email || '')
        })).filter(subject => subject.isMine)
    }, [subjects, courseYear, role.isAdmin, session?.user.email])


    async function save() {
        if (!ready || loading) return
        setLoading(true)
        await createCommunications(filteredSelectedStudents.map(student => ({
            subject: subjectCode || '',
            timestamp: timestamp.toDate(),
            message: message,
            comment: comment,
            student: student?.enrolment || '',
            action_taken: action_taken
        }))).then(() => {
            setLoading(false)
            void router.push({
                pathname: '/comunicaciones',
                query: {
                    dateRange: `${timestamp.valueOf() - 1}..${timestamp.valueOf() + 1}`
                }
            })
        }).catch(() => {
            setLoading(false)
        })
    }

    return <div>
        <AppBar />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container>
                <Box sx={{ flexGrow: 1 }} className='pt-4'>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6} >
                            <h1 className='text-xl mb-[18px]'>Crear nueva comunicación</h1>
                            <div className='grid gap-2 grid-cols-[1fr_2fr]'>
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Curso</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={courseYear}
                                        label="Curso"
                                        onChange={(value) => {
                                            void setCourseYear((value.target.value || '').toString())
                                        }}
                                    >
                                        {courses?.map(course => <MenuItem value={course.year} key={course.year}><span className='py-1'>{course.year}°</span></MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Materia</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={subjectCode}
                                        label="Materia"
                                        onChange={(value) => {
                                            void setSubjectCode(value.target.value?.toString() || '')
                                        }}
                                    >
                                        {filteredSubjects?.map(subject => <MenuItem value={subject.code} key={subject.code}><span className={'py-1' + (subject.isMine ? '' : ' text-sm text-gray-400')}>{subject.name} <span className={'text-gray-400 text-sm'}>{subject.code}</span></span></MenuItem>)}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className='mt-3'>
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Agregar estudiante</InputLabel>
                                    <Select
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={''}
                                        label="Agregar estudiante"
                                        onChange={(value) => {
                                            setSelectedStudents([...new Set([...selectedStudents, value.target.value?.toString() || ''])])
                                        }}
                                    >
                                        {students?.map(student => <MenuItem value={student.enrolment} key={student.enrolment}><span className='py-1'><span className='text-gray-500 text-sm mb-1 block'>{student.enrolment}</span> {student.name}</span></MenuItem>)}
                                    </Select>
                                </FormControl>
                            </div>

                            <div className='grid gap-2 grid-cols-2 mt-3'>
                                <DatePicker label="Fecha" sx={{ width: '100%' }}
                                    minDate={dayjs().subtract(10, 'days')}
                                    maxDate={dayjs().add(1, 'minute')}
                                    format="DD/MM/YYYY"
                                    value={timestamp}
                                    onChange={(date) => setTimestamp(dayjs(date?.toString() || '').startOf('day').add(timestamp.hour(), 'hour').add(timestamp.minute(), 'minute'))}
                                />
                                <TimePicker label="Hora"
                                    maxTime={timestamp.startOf('day').valueOf() === dayjs().startOf('day').valueOf() ? dayjs().add(1, 'minute') : undefined}
                                    value={timestamp}
                                    onChange={(_date) => {
                                        const date = dayjs(_date?.toString() || '')
                                        void setTimestamp(dayjs(timestamp).startOf('day').add(date.hour(), 'hour').add(date.minute(), 'minute'))
                                    }}
                                />
                            </div>

                        </Grid>

                        <Grid item xs={12} md={6}>
                            <div className=''>
                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Motivo</InputLabel>
                                    <Select
                                        required
                                        labelId="demo-simple-select-label"
                                        id="demo-simple-select"
                                        value={message}
                                        label="Motivo"
                                        onChange={(value) => {
                                            setMessage(value.target.value?.toString() || '')
                                        }}
                                    >
                                        {messages?.map(message => <MenuItem value={message.text} key={message.text}><span className='py-1' style={{ color: message.sentiment.color }}>{message.text}</span></MenuItem>)}
                                    </Select>
                                </FormControl>
                            </div>
                            <div className='mt-3'>
                                <TextField
                                    rows={2}
                                    id="outlined-basic"
                                    label="Detalle"
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                />
                            </div>
                            <div className='mt-3'>
                                <TextField
                                    rows={2}
                                    id="outlined-basic"
                                    label="Acción pedagógica que tomó el docente"
                                    variant="outlined"
                                    fullWidth
                                    multiline
                                    required
                                    value={action_taken}
                                    onChange={e => setActionTaken(e.target.value)}
                                />
                            </div>
                        </Grid>
                    </Grid>
                    <div className='mt-3'>
                        {filteredSelectedStudents.length > 0 ? <div className='mt-2'>
                            <div className='text-gray-500'>
                                Estudiantes
                            </div>
                            {
                                filteredSelectedStudents.map(student => <Chip
                                    avatar={<Avatar {...stringAvatar(transformName(student.name))} />}
                                    key={student.enrolment}
                                    label={student.name}
                                    variant='outlined'
                                    sx={{ m: 0.2 }}
                                    onDelete={() => {
                                        setSelectedStudents(selectedStudents.filter(s => s !== student.enrolment))
                                    }}
                                />)
                            }
                        </div> : <div>
                            {!(missingStudent) && "Estudiantes seleccionados: 0"}
                            {!!(missingStudent) && <p className='text-red-500'>Agregue al menos un estudiante</p>}
                        </div>}
                    </div>
                    {!!(almostReady && !ready) && <div className='mt-3'>
                        <p className='text-red-500'>Completar campos faltantes (*)</p>
                    </div>}
                    <div className='mt-3'>
                        <Button fullWidth variant='outlined' className='mt-3' disabled={!ready || loading}
                            onClick={() => {
                                if (ready && !loading) void save()
                            }}
                        >
                            {loading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </div>
                </Box>
            </Container>
        </LocalizationProvider>
    </div>
}

