import { Card, Button, Container, Stack, Alert, AlertTitle, LinearProgress } from '@mui/material';
import AppBar from '~/lib/components/AppBar';
import AddIcon from '@mui/icons-material/Add';
import { useUserRole } from '~/lib/util/useUserRole';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '~/lib/ProtectedRoute';

const REDIRECT_URL = 'https://console.henryford.edu.ar/comunicados';
const REDIRECT_SECONDS = 6;

export default function HomeWrapper() {
    return <ProtectedRoute>
        <Home />
    </ProtectedRoute>
}

export function Home() {
    const role = useUserRole()
    const router = useRouter()
    const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)
    const [cancelled, setCancelled] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (cancelled) return
        intervalRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    window.location.href = REDIRECT_URL
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [cancelled])

    const handleCancel = () => {
        setCancelled(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return <div>
        <AppBar />
        <Container>
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                <AlertTitle>Este sistema será dado de baja</AlertTitle>
                {!cancelled
                    ? <>Serás redirigido al nuevo sistema en <strong>{secondsLeft}</strong> segundos.</>
                    : <>Por favor, utilizá el nuevo sistema de comunicados.</>
                }
            </Alert>
            {!cancelled && <LinearProgress
                variant="determinate"
                value={((REDIRECT_SECONDS - secondsLeft) / REDIRECT_SECONDS) * 100}
                sx={{ mb: 1, borderRadius: 1, height: 6 }}
            />}
            <a
                href={REDIRECT_URL}
                style={{ textDecoration: 'none', display: 'block' }}
            >
                <Card sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#1565c0' },
                    mb: 2,
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Ir al nuevo sistema de comunicados
                    </div>
                    <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                        console.henryford.edu.ar/comunicados
                    </div>
                </Card>
            </a>
            {!cancelled && <Button
                variant="outlined"
                color="inherit"
                fullWidth
                sx={{ mb: 2 }}
                onClick={handleCancel}
            >
                Cancelar redirección
            </Button>}

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
                        void router.push('/settings')
                    }}>Configuración</Button>
                </Card>}
            </Stack>

        </Container>
    </div>
}