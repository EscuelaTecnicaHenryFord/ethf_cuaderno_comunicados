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
import GroupsIcon from '@mui/icons-material/Groups';
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

export default function Communications() {
    const filters = useFilters()

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
                checkboxSelection
            />
        </Box>
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 180,
                height: 53,
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
                <Button variant="text" startIcon={<TuneIcon />}>FILTRAR</Button>
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

                {!filters.values.dateRange && <Chip
                    icon={<AddIcon />}
                    label="Fecha"
                    onClick={() => filters.pickers.setOpen.dateRange(true)}
                />}
                {filters.values.dateRange && <Chip
                    icon={<CalendarMonthIcon />}
                    label={`${dayjs(filters.values.dateRange[0]).format('DD/MM/YYYY')} - ${dayjs(filters.values.dateRange[1]).format('DD/MM/YYYY')}`}
                    onClick={() => filters.pickers.setOpen.dateRange(true)}
                    onDelete={() => filters.setters.setDateRange(null)} />}



                {!filters.values.course && <Chip
                    icon={<AddIcon />}
                    label="Curso"
                    onClick={() => filters.pickers.setOpen.course(true)}
                />}
                {filters.values.course && <Chip
                    icon={<GroupsIcon />}
                    label="7° año"
                    onClick={() => filters.pickers.setOpen.course(true)}
                    onDelete={() => filters.setters.setCourse(null)} />}



                {!filters.values.subject && <Chip
                    icon={<AddIcon />}
                    label="Materia"
                    onClick={() => filters.pickers.setOpen.subject(true)}
                />}
                {filters.values.subject && <Chip
                    icon={<SchoolIcon />}
                    label="Matemática"
                    onClick={() => filters.pickers.setOpen.subject(true)}
                    onDelete={() => filters.setters.setSubject(null)} />}



                {!filters.values.student && <Chip
                    icon={<AddIcon />}
                    label="Estudiante"
                    onClick={() => filters.pickers.setOpen.student(true)}
                />}
                {filters.values.student && <Chip
                    icon={<FaceIcon />}
                    label="ALMARAZ IGLESIAS, Lola"
                    onClick={() => filters.pickers.setOpen.student(true)}
                    onDelete={() => filters.setters.setStudent(null)} />}



                {!filters.values.teacher && <Chip
                    icon={<AddIcon />}
                    label="Docente"
                    onClick={() => filters.pickers.setOpen.teacher(true)}
                />}
                {filters.values.teacher && <Chip
                    icon={<PersonIcon />}
                    label="Tomás Cichero"
                    onClick={() => filters.pickers.setOpen.teacher(true)}
                    onDelete={() => filters.setters.setTeacher(null)} />}
            </Stack>
        </Box>
    </div>
}


const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'firstName', headerName: 'First name', width: 130 },
    { field: 'lastName', headerName: 'Last name', width: 130 },
    {
        field: 'age',
        headerName: 'Age',
        type: 'number',
        width: 90,
    },
    {
        field: 'fullName',
        headerName: 'Full name',
        description: 'This column has a value getter and is not sortable.',
        sortable: false,
        width: 160,
        valueGetter: (params: GridValueGetterParams) =>
            `${params.row.firstName || ''} ${params.row.lastName || ''}`,
    },
];

const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
];

function Pickers({ filters }: { filters: ReturnType<typeof useFilters> }) {
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
    const [start, end] = dateRange?.map<number>(date => date.valueOf()) || [null, null]

    function setStart(value: number) {
        setDateRange([value, end ?? (value + (1000 * 60 * 60 * 24))])
    }
    function setEnd(value: number) {
        setDateRange([start ?? (value - (1000 * 60 * 60 * 24)), value])
    }

    function closeDateRange() {
        filters.pickers.setOpen.dateRange(false)
    }

    return <React.Fragment>
        <Dialog open={filters.pickers.open.dateRange} onClose={() => filters.pickers.setOpen.dateRange(false)}>
            <DialogTitle>Mostrar rango</DialogTitle>
            <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Typography>
                        Mostrar desde
                    </Typography>
                    <DatePicker value={start ? dayjs(start) : null} onChange={v => v && setStart(v.valueOf())}/>
                    <Typography className='mt-3'>
                        Mostrar hasta
                    </Typography>
                    <DatePicker value={end ? dayjs(end) : null} onChange={v => v && setEnd(v.valueOf())} />
                    <Stack
                        className='mt-3'
                        spacing={1}
                        direction="row"
                        alignItems="center"
                    >
                        <Chip label="Hoy" onClick={() => {
                            setDateRange([today.valueOf(), todayEnd.valueOf()])
                            closeDateRange()
                        }} />
                        <Chip label="Ayer" onClick={() => {
                            setDateRange([yesterday.valueOf(), yesterdayEnd.valueOf()])
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
                            setDateRange([monthStart.valueOf(), monthEnd.valueOf()])
                            closeDateRange()
                        }} />
                        <Chip label="Este mes" onClick={() => {
                            setDateRange([lastMonthStart.valueOf(), lastMonthEnd.valueOf()])
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
                            setDateRange([firstCuatrimesterStart.valueOf(), firstCuatrimesterEnd.valueOf()])
                            closeDateRange()
                        }} />
                        <Chip label="Segundo" onClick={() => {
                            setDateRange([secondCuatrimesterStart.valueOf(), secondCuatrimesterEnd.valueOf()])
                            closeDateRange()
                        }} />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    setDateRange(null)
                    closeDateRange()
                }} color='error' autoFocus>Borrar</Button>
                <Button onClick={closeDateRange} autoFocus>Cerrar</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={filters.pickers.open.course} onClose={() => filters.pickers.setOpen.course(false)}>
            Curso
        </Dialog>

        <Dialog open={filters.pickers.open.subject} onClose={() => filters.pickers.setOpen.subject(false)}>
            Materia
        </Dialog>

        <Dialog open={filters.pickers.open.student} onClose={() => filters.pickers.setOpen.student(false)}>
            Estudiante
        </Dialog>

        <Dialog open={filters.pickers.open.teacher} onClose={() => filters.pickers.setOpen.teacher(false)}>
            Docente
        </Dialog>
    </React.Fragment>

}

