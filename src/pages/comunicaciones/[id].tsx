import { Button, Chip, Container } from "@mui/material";
import { useRouter } from "next/router";
import ProtectedRoute from "~/lib/ProtectedRoute";
import AppBar from "~/lib/components/AppBar";
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { api } from "~/utils/api";
import dayjs from "dayjs";
import { useUserRole } from "~/lib/util/useUserRole";
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { use, useEffect, useState } from 'react'

export default function Communication() {
    const router = useRouter()
    const id = router.query.id?.toString() || ''
    const role = useUserRole()

    const { data, isInitialLoading, error, isFetched, refetch } = api.getCommunication.useQuery(id, { enabled: !!id })
    const { mutateAsync: deleteCommunications } = api.deleteCommunications.useMutation()
    const { mutateAsync: updateCommunicationFollowUp } = api.updateCommunicationFollowUp.useMutation()

    const [followUpState, setFollowUpState] = useState<string | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [followUp, setFollowUp] = useState<string | null>(null);

    useEffect(() => {
        if (isFetched && data && followUpState == null && followUp == null) {
            setFollowUpState(data.state as unknown as string)
            setFollowUp(data.followup as unknown as string)
            setCategory(data.category || null)
        }
    }, [isFetched, data, followUpState, followUp])

    const e404 = (data == null && !isInitialLoading && !error) || !id

    const pendingChanges = data && (followUpState != data.state || followUp != data.followup || category != data.category)

    return <ProtectedRoute>
        <AppBar />
        <Container>
            {e404 && <h1 className="text-center mt-5 font-xl">
                🚫 No se encontró la comunicación
            </h1>}
            {error && <h1 className="text-center mt-5 font-xl">
                🚫 Ocurrió un error al cargar la comunicación
            </h1>}

            {data && <div className="mt-5">
                <div className="">
                    <label className="text-sm font-semibold">Docente</label>
                    <p className="text-xl">{data.teacher?.name || data.teacherEmail}</p>
                    <p>{dayjs(data.timestamp).format('DD/MM/YY - HH:mm')} <span className="text-gray-500 font-bold">{data.subjectCode}</span> {data.subject?.name}</p>
                </div>
                <div className="mt-3">
                    <label className="text-sm font-semibold">Estudiante</label>
                    <h1 className="text-xl">{data.studentEnrolment} - {data.student?.name}</h1>
                    {data?.pool && <>
                        <label className="text-sm font-semibold">También estuvieron involucrados</label>
                        <div className="">
                            {data.pool.communications.filter(com => com.studentEnrolment != data.studentEnrolment).map(com => <Chip key={com.id} label={com.studentEnrolment} className="mr-1 mb-1"
                                onClick={() => void router.push(`/comunicaciones/${com.id}`)}
                            />)}
                        </div>
                    </>}
                </div>
                <div className="mt-3">
                    <label className="text-sm font-semibold">Mensaje</label>
                    <h2 className="text-xl" style={{ color: data.color }}>{data.message}</h2>
                </div>
                {data.comment && <div className="mt-3">
                    <label className="text-sm font-semibold">Comentario</label>
                    <p className="text-xl">{data.comment}</p>
                </div>}
                {data.action_taken && <div className="mt-3">
                    <label className="text-sm font-semibold">Acción pedagógica tomada por el docente</label>
                    <p className="text-xl">{data.action_taken}</p>
                </div>}
                <hr className="mb-2 mt-3" />
                <div>
                    <label className="text-sm font-semibold">Seguimiento</label>
                    <div>
                        <TextField multiline fullWidth minRows={3} placeholder="Escribe el seguimiento del caso aquí..."
                            onChange={(e) => {
                                const value = e.target.value
                                setFollowUp(value)
                            }}

                            value={followUp || ''}
                        />
                    </div>
                    <div className="mt-3">
                        <StateSelect
                            value={followUpState || 'pending'}
                            onChange={(value) => {
                                setFollowUpState(value)
                            }}
                        />
                    </div>
                    <div className="mt-3">


                    <CategorySelect
                        value={category || ''}
                        onChange={(value) => {
                            setCategory(value || null)
                        }}
                    />
                </div>
                </div>
            </div>}



            <hr className="mb-2 mt-3" />
            {pendingChanges && <p className="text-red-500">
                *Tienes cambios sin guardar
            </p>}
            <div className="flex gap-2">

                {(data && role.isAdmin) && <Button variant="outlined" startIcon={<DeleteIcon />} color="error" className="mt-2"
                    onClick={() => {
                        void deleteCommunications([id]).then(() => {
                            if (confirm("¿Eliminar comunicación?")) {
                                void router.push('/comunicaciones')
                            }
                        })
                    }}
                >
                    Eliminar
                </Button>}

                {pendingChanges && <Button variant="outlined" startIcon={<SaveIcon />} color="primary" className="mt-2"
                    onClick={() => {
                        if (followUpState === null || followUp === null) return;
                        void updateCommunicationFollowUp({ id, followUp, state: followUpState as unknown as ("pending" | "in_process" | "finalized"), category }).then(() => {
                            void refetch()
                        })
                    }}
                >
                    Guardar
                </Button>}
            </div>
        </Container>
    </ProtectedRoute>
}

function StateSelect({ onChange, value }: { onChange?: (value: string) => unknown, value?: string }) {
    return <FormControl fullWidth>
        <InputLabel id="state-select-label">Estado</InputLabel>
        <Select
            labelId="state-select-label"
            id="state-select"
            value={value}
            label="Estado"
            onChange={e => onChange?.(e.target.value)}
        >
            <MenuItem value={"pending"}><Dot color="#bbbbbb" />Pendiente</MenuItem>
            <MenuItem value={"in_process"}><Dot color="#ffea00" />En proceso</MenuItem>
            <MenuItem value={"finalized"}><Dot color="#76ff03" />Finalizado</MenuItem>
        </Select>
    </FormControl>
}

function CategorySelect({ onChange, value }: { onChange?: (value: string) => unknown, value?: string }) {
    const { data: categories } = api.getCategories.useQuery()

    return <FormControl fullWidth>
        <InputLabel id="category-select-label">Categoría</InputLabel>
        <Select
            labelId="category-select-label"
            id="cateogry-select"
            value={value}
            label="Categoría"
            onChange={e => onChange?.(e.target.value)}
        >
            {categories?.map(category => <MenuItem value={category.code} key={category.code}><span className='py-1'>{category.name}</span></MenuItem>)}
        </Select>
    </FormControl>
}

function Dot({ color }: { color: string }) {
    return <span className="h-[10px] w-[10px] rounded-full inline-block mb-[1px] mr-2" style={{ backgroundColor: color }}>

    </span>
}