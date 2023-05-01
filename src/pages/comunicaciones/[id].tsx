import { Button, Chip, Container } from "@mui/material";
import { useRouter } from "next/router";
import ProtectedRoute from "~/lib/ProtectedRoute";
import AppBar from "~/lib/components/AppBar";
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from "~/utils/api";
import dayjs from "dayjs";
import { useUserRole } from "~/lib/util/useUserRole";

export default function Communication() {
    const router = useRouter()
    const id = router.query.id?.toString() || ''
    const role = useUserRole()

    const { data, isInitialLoading, error } = api.getCommunication.useQuery(id, { enabled: !!id })
    const { mutateAsync: deleteCommunications } = api.deleteCommunications.useMutation()

    const e404 = (data == null && !isInitialLoading && !error) || !id

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
                    <label className="text-sm font-semibold">Profesor</label>
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
                    <h2 className="text-xl">{data.message}</h2>
                </div>
                {data.comment && <div className="mt-3">
                    <label className="text-sm font-semibold">Comentario</label>
                    <p className="text-xl">{data.comment}</p>
                </div>}
            </div>}
            {(data && role.isAdmin) && <Button variant="outlined" startIcon={<DeleteIcon />} color="error" className="mt-2"
                onClick={() => {
                    void deleteCommunications([id]).then(() => {
                        if(confirm("¿Eliminar comunicación?")) {
                            void router.push('/comunicaciones')
                        }
                    })
                }}
            >
                Eliminar
            </Button>}
        </Container>
    </ProtectedRoute>
}