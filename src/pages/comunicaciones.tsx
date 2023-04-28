import React from 'react'
import AppBar from '~/lib/components/AppBar';
import { DataGrid, type GridColDef, type GridValueGetterParams } from '@mui/x-data-grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TuneIcon from '@mui/icons-material/Tune';
import Chip
    from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolIcon from '@mui/icons-material/School';
import FaceIcon from '@mui/icons-material/Face';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import { useFilters } from '~/lib/useFilters';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs'
import { Typography } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import { api } from '~/utils/api';
import { useMemo } from 'react'
import { useState } from 'react'
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';

import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import { nameInitials, stringAvatar, transformName } from '~/lib/util/nameUtils';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export default function Communications() {
    const filters = useFilters()

    const [start, end] = filters.values.dateRange || [undefined, undefined]

    const { data: communications } = api.getCommunications.useQuery({
        mineOnly: false,
        from: start ? new Date(start) : null,
        to: end ? new Date(end) : null,
        student: filters.values.student,
        subject: filters.values.subject,
        course: filters.values.course,
        teacher: filters.values.teacher,
    })

    const rows = useMemo(() => {
        if (!communications) return []

        return communications.map(communication => ({
            id: communication.id,
            studentName: communication.student?.name || '<no encontrado>',
            studentEnrolment: communication.student?.enrolment,
            subjectName: communication.subject?.name ? `${communication.subjectCode} - ${communication.subject?.name}` : communication.subjectCode,
            message: communication.message,
            date: dayjs(dayjs(communication.timestamp).valueOf()).format('DD/MM/YYYY'),
            time: dayjs(dayjs(communication.timestamp).valueOf()).format('HH:ss'),
            teacherName: communication.teacher?.name || communication.teacherEmail,
            comment: communication.comment,
        }))
    }, [communications])

    const [selection, setSelection] = useState<string[]>([])

    function SelectedOptions() {
        return <>
            {selection.length === 1 && <Tooltip title="Abrir seleccionado">
                <IconButton aria-label="open selected"
                    onClick={() => {
                        window.open(`/comunicaciones/${selection[0] || ''}`)
                    }}
                >
                    <OpenInNewIcon color='action' />
                </IconButton>
            </Tooltip>}

            {selection.length > 1 && <Tooltip title="Cantidad seleccionados">
                <Chip label={selection.length} sx={{ fontWeight: 500 }} />
            </Tooltip>}

            {selection.length >= 1 && <Tooltip title="Eliminar seleccionados">
                <IconButton aria-label="delete">
                    <DeleteIcon color='error' />
                </IconButton>
            </Tooltip>}
        </>
    }

    return <div>
        <AppBar />
        <Pickers filters={filters} />
        <Box
            sx={{
                position: 'fixed',
                top: 60,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            <DataGrid
                sx={{ border: 'none' }}
                rows={rows}
                columns={columns}
                paginationModel={{ page: 0, pageSize: 5 }}
                columnVisibilityModel={{ id: false }}
                // onRowDoubleClick={(row) => {
                //     row.id && window.open(`/comunicaciones/${row.id}`)
                // }}
                onRowSelectionModelChange={s => setSelection(s.map(s => s.toString()))}
                checkboxSelection
            />
        </Box>
        <Box
            sx={{
                backgroundColor: 'white',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 180,
                height: 52,
            }}
        >
            <Stack
                spacing={2}
                direction="row"
                alignItems="center"
                height={53}
                marginLeft={2}
                sx={{ display: { lg: 'none' } }}
            >
                <SelectedOptions />
                <Tooltip title="Filtrar comunicaciones">
                    <IconButton aria-label="filter">
                        <TuneIcon color='primary' />
                    </IconButton>
                </Tooltip>

            </Stack>
            <Stack
                spacing={2}
                direction="row"
                alignItems="center"
                height={53}
                marginLeft={2}
                overflow={'auto'}
                sx={{ display: { sm: 'none', lg: 'flex' } }}
            >
                <SelectedOptions />


                {!filters.values.dateRange && <Chip
                    icon={<AddIcon />}
                    label="Fecha"
                    onClick={() => filters.pickers.setOpen.dateRange(true)}
                />}
                {filters.values.dateRange && <Chip
                    icon={<CalendarMonthIcon />}
                    label={`${dayjs(filters.values.dateRange[0]).format('DD/MM/YYYY')} - ${dayjs(filters.values.dateRange[1]).format('DD/MM/YYYY')}`}
                    onClick={() => filters.pickers.setOpen.dateRange(true)}
                    onDelete={() => void filters.setters.setDateRange(null)} />}



                {!filters.values.course && <Chip
                    icon={<AddIcon />}
                    label="Curso"
                    onClick={() => filters.pickers.setOpen.course(true)}
                />}
                {filters.values.course && <Chip
                    icon={<PeopleIcon />}
                    label={`${filters.values.course}° año`}
                    onClick={() => filters.pickers.setOpen.course(true)}
                    onDelete={() => void filters.setters.setCourse(null)} />}



                {!filters.values.subject && <Chip
                    icon={<AddIcon />}
                    label="Materia"
                    onClick={() => filters.pickers.setOpen.subject(true)}
                />}
                {filters.values.subject && <Chip
                    icon={<SchoolIcon />}
                    label={`${filters.values.subject}`}
                    onClick={() => filters.pickers.setOpen.subject(true)}
                    onDelete={() => void filters.setters.setSubject(null)} />}



                {!filters.values.student && <Chip
                    icon={<AddIcon />}
                    label="Estudiante"
                    onClick={() => filters.pickers.setOpen.student(true)}
                />}
                {filters.values.student && <Chip
                    icon={<FaceIcon />}
                    label="ALMARAZ IGLESIAS, Lola"
                    onClick={() => filters.pickers.setOpen.student(true)}
                    onDelete={() => void filters.setters.setStudent(null)} />}



                {!filters.values.teacher && <Chip
                    icon={<AddIcon />}
                    label="Docente"
                    onClick={() => filters.pickers.setOpen.teacher(true)}
                />}
                {filters.values.teacher && <Chip
                    icon={<PersonIcon />}
                    label={`${filters.values.teacher}`}
                    onClick={() => filters.pickers.setOpen.teacher(true)}
                    onDelete={() => void filters.setters.setTeacher(null)} />}
            </Stack>
        </Box>
    </div>
}


// const columns: GridColDef[] = [
//     { field: 'id', headerName: 'ID', width: 70, hideable: true, },
// ]

const columns: GridColDef[] = [
    { field: 'studentEnrolment', headerName: 'Matrícula', width: 100 },
    { field: 'studentName', headerName: 'Nombre', width: 190 },
    { field: 'subjectName', headerName: 'Materia', width: 210 },
    { field: 'message', headerName: 'Mensaje', width: 350 },
    { field: 'date', headerName: 'Fecha', width: 100 },
    { field: 'time', headerName: 'Hora', width: 60 },
    { field: 'teacherName', headerName: 'Docente', width: 130 },
    { field: 'comment', headerName: 'Comentario', width: 500 },
    // {
    //     field: 'age',
    //     headerName: 'Age',
    //     type: 'number',
    //     width: 90,
    // },
    // {
    //     field: 'fullName',
    //     headerName: 'Full name',
    //     description: 'This column has a value getter and is not sortable.',
    //     sortable: false,
    //     width: 160,
    //     valueGetter: (params: GridValueGetterParams) =>
    //         `${params.row.firstName || ''} ${params.row.lastName || ''}`,
    // },
    { field: 'id', width: 20, }
];


function Pickers({ filters }: { filters: ReturnType<typeof useFilters> }) {
    const { data: courses } = api.getCourses.useQuery()
    const { data: subjects } = api.getAllSubjects.useQuery()
    const { data: students } = api.getAllStudents.useQuery()
    const { data: teachers } = api.getTeachers.useQuery()

    const today = dayjs().startOf('day')
    const todayEnd = dayjs().endOf('day')

    const yesterday = dayjs().subtract(1, 'day').startOf('day')
    const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day')

    const monthStart = dayjs().startOf('month').startOf('day')
    const monthEnd = dayjs().endOf('month').endOf('day')

    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').startOf('day')
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').endOf('day')

    const firstCuatrimesterStart = dayjs('2022-03-01').startOf('day')
    const secondCuatrimesterStart = dayjs('2022-08-01').startOf('day')
    const firstCuatrimesterEnd = secondCuatrimesterStart.subtract(1, 'day').endOf('day')
    const secondCuatrimesterEnd = dayjs('2022-12-31').endOf('day')

    const [dateRange, setDateRange] = [filters.values.dateRange, filters.setters.setDateRange]
    const [start, end] = dateRange?.map<number>(date => date || 0) || [null, null]

    function setStart(value: number) {
        void setDateRange([value, end ?? (value + (1000 * 60 * 60 * 24))])
    }
    function setEnd(value: number) {
        void setDateRange([start ?? (value - (1000 * 60 * 60 * 24)), value])
    }

    function closeDateRange() {
        filters.pickers.setOpen.dateRange(false)
    }

    function closeCourse() {
        filters.pickers.setOpen.course(false)
    }

    function closeSubject() {
        filters.pickers.setOpen.subject(false)
    }

    function closeStudent() {
        filters.pickers.setOpen.student(false)
    }

    function closeTeacher() {
        filters.pickers.setOpen.teacher(false)
    }

    return <React.Fragment>
        <Dialog open={filters.pickers.open.dateRange} onClose={() => filters.pickers.setOpen.dateRange(false)}>
            <DialogTitle>Mostrar rango</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Typography>
                        Mostrar desde
                    </Typography>
                    <DatePicker value={start ? dayjs(start) : null} onChange={v => v && setStart(v.valueOf())} format="DD/MM/YYYY" />
                    <Typography className='mt-3'>
                        Mostrar hasta
                    </Typography>
                    <DatePicker value={end ? dayjs(end) : null} onChange={v => v && setEnd(v.valueOf())} format="DD/MM/YYYY" />
                    <Stack
                        className='mt-3'
                        spacing={1}
                        direction="row"
                        alignItems="center"
                    >
                        <Chip label="Hoy" onClick={() => {
                            void setDateRange([today.valueOf(), todayEnd.valueOf()])
                            closeDateRange()
                        }} />
                        <Chip label="Ayer" onClick={() => {
                            void setDateRange([yesterday.valueOf(), yesterdayEnd.valueOf()])
                            closeDateRange()
                        }} />
                    </Stack>
                    <Stack
                        className='mt-3'
                        spacing={1}
                        direction="row"
                        alignItems="center"
                    >
                        <Chip label="Este mes" onClick={() => {
                            void setDateRange([monthStart.valueOf(), monthEnd.valueOf()])
                            closeDateRange()
                        }} />
                        <Chip label="Mes pasado" onClick={() => {
                            void setDateRange([lastMonthStart.valueOf(), lastMonthEnd.valueOf()])
                            closeDateRange()
                        }} />
                    </Stack>
                    <Typography className='mt-3'>
                        Cuatrimestre
                    </Typography>
                    <Stack
                        className='mt-3'
                        spacing={1}
                        direction="row"
                        alignItems="center"
                    >
                        <Chip label="Primero" onClick={() => {
                            void setDateRange([firstCuatrimesterStart.valueOf(), firstCuatrimesterEnd.valueOf()])
                            closeDateRange()
                        }} />
                        <Chip label="Segundo" onClick={() => {
                            void setDateRange([secondCuatrimesterStart.valueOf(), secondCuatrimesterEnd.valueOf()])
                            closeDateRange()
                        }} />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    void setDateRange(null)
                    closeDateRange()
                }} color='error' autoFocus>Borrar</Button>
                <Button onClick={closeDateRange} autoFocus>Cerrar</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={filters.pickers.open.course} onClose={() => filters.pickers.setOpen.course(false)}>
            <Box sx={{ width: 250, maxWidth: '100%' }}>
                <DialogTitle>Curso</DialogTitle>
                <List>
                    {courses?.map(course => <ListItemButton
                        key={course.year}
                        onClick={() => {
                            void filters.setters.setCourse(course.year)
                            closeCourse()
                        }}
                    >
                        <ListItemText className='ml-2' primary={course.label} />
                    </ListItemButton>)}
                </List>
            </Box>
        </Dialog>

        <Dialog open={filters.pickers.open.subject} onClose={() => filters.pickers.setOpen.subject(false)}>
            <Box sx={{ width: 250, maxWidth: '100%' }}>
                <DialogTitle>Materia</DialogTitle>
                <List>
                    {subjects?.filter(s => {
                        if (filters.values.course) {
                            return s.courseYear === filters.values.course
                        }
                        return true
                    }).map(subject => <ListItemButton
                        key={subject.code}
                        onClick={() => {
                            void filters.setters.setSubject(subject.code)
                            closeSubject()
                        }}
                    >
                        <ListItemText className='ml-2' primary={`${subject.courseYear}° - ${subject.name}`} />
                    </ListItemButton>)}
                </List>
            </Box>
        </Dialog>

        <Dialog open={filters.pickers.open.student} onClose={() => filters.pickers.setOpen.student(false)}>
            <Box sx={{ width: 450, maxWidth: '100%' }}>
                <DialogTitle>Estudiantes</DialogTitle>
                <List>
                    {students?.filter(s => {
                        if (filters.values.course) {
                            return s.coursingYear === filters.values.course
                        }
                        return true
                    }).map(student => <ListItemButton
                        key={student.enrolment}
                        onClick={() => {
                            void filters.setters.setStudent(student.enrolment)
                            closeStudent()
                        }}
                    >
                        <ListItemAvatar
                            className='ml-2'
                        >
                            <Avatar {...stringAvatar(student.name)}>
                                {nameInitials(transformName(student.name))}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={student.name}
                            secondary={
                                <React.Fragment>
                                    <Typography
                                        sx={{ display: 'inline' }}
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                    >
                                        {student.enrolment}
                                    </Typography>
                                    {" — "}{student.coursingYear}° año
                                </React.Fragment>
                            }
                        />
                    </ListItemButton>)}
                </List>
            </Box>
        </Dialog>

        <Dialog open={filters.pickers.open.teacher} onClose={() => filters.pickers.setOpen.teacher(false)}>
            <Box sx={{ width: 450, maxWidth: '100%' }}>
                <DialogTitle>Docentes</DialogTitle>
                <List>
                    {teachers?.map(teacher => <ListItemButton
                        key={teacher.email}
                        onClick={() => {
                            void filters.setters.setTeacher(teacher.email)
                            closeTeacher()
                        }}
                    >
                        <ListItemAvatar
                            className='ml-2'
                        >
                            <Avatar {...stringAvatar(teacher.name)}>
                                {nameInitials(teacher.name)}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={teacher.name}
                            secondary={
                                <React.Fragment>
                                    <Typography
                                        sx={{ display: 'inline' }}
                                        component="span"
                                        variant="body2"
                                        color="text.primary"
                                    >
                                        {teacher.email}
                                    </Typography>
                                    {/* {" — "}lorem ipsum */}
                                </React.Fragment>
                            }
                        />
                    </ListItemButton>)}
                </List>
            </Box>
        </Dialog>
    </React.Fragment>

}

