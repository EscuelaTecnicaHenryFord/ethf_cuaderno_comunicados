import { Card, Button, Container, Stack } from '@mui/material';
import AppBar from '~/lib/components/AppBar';
import AddIcon from '@mui/icons-material/Add';
import { useUserRole } from '~/lib/util/useUserRole';
import { useRouter } from 'next/router';
import ProtectedRoute from '~/lib/ProtectedRoute';


export default function HomeWrapper() {
    return <ProtectedRoute>
        <Home />
    </ProtectedRoute>
}

export function Home() {
    const role = useUserRole()
    const router = useRouter()

    return <div>
        <AppBar />
        <Container>
            <Stack spacing={2} sx={{ mt: 1 }}>
                {(role.isAdmin || role.isTeacher) && <Card>
                    <Button variant="text" startIcon fullWidth sx={{ p: 2 }} onClick={() => {
                        void router.push('/nueva-comunicacion')
                    }}>Registrar nueva comunicación</Button>
                </Card>}
                {(role.isAdmin || role.isTeacher) && <Card>
                    <Button variant="text" startIcon fullWidth sx={{ p: 2 }} onClick={() => {
                        void router.push('/comunicaciones')
                    }}>Ver comunicaciones</Button>
                </Card>}
                {role.isAdmin && <Card>
                    <Button variant="text" startIcon fullWidth sx={{ p: 2 }} onClick={() => {
                        void router.push('/settings/general.json')
                    }}>Configuración</Button>
                </Card>}
            </Stack>

        </Container>
    </div>
}