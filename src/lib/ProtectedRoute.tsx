import { signIn, signOut, useSession } from "next-auth/react"
import { useUserRole } from "./util/useUserRole"
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';
import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";

const REDIRECT_URL = 'https://console.henryford.edu.ar/comunicados';
const REDIRECT_SECONDS = 6;

interface Props {
    children: React.ReactNode
    requiredAdmin?: boolean
    requiredTeacher?: boolean
}

export default function ProtectedRoute({ children, requiredAdmin, requiredTeacher }: Props) {
    const { isAdmin, isTeacher, isLoading } = useUserRole()
    const { data: session, status } = useSession()

    console.log({ isAdmin, isTeacher, isLoading, session, status })

    if (status === 'unauthenticated') {
        return <SignedOutRoute />
    }

    if (status === 'loading' || isLoading) {
        return <LoadingRoute />
    }

    if (requiredAdmin && !isAdmin) {
        return <NotAllowedRoute />
    }

    if (requiredTeacher && !isTeacher) {
        return <NotAllowedRoute />
    }

    if (isAdmin || isTeacher) {
        return <>
            <Head>
                <title>Comunicaciones</title>
            </Head>
            {children}
        </>
    }

    return <NotAllowedRoute />
}

function NotAllowedRoute() {
    const router = useRouter()

    return <div>
        <Head>
            <title>🚫 Sin permiso</title>
        </Head>
        <SignedInAppBar />
        <h1 className="text-center mt-5 font-xl">
            No tienes permiso para ver esta página
        </h1>
        {(router.pathname != '/') && <center>
            <Button variant="outlined" className="mt-2 py-3 px-8" onClick={() => void router.push('/')}>Página de inicio</Button>
        </center>}
    </div>
}

function SignedOutRoute() {
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
        <Head>
            <title>Iniciar Sesión</title>
        </Head>
        <SignedOutAppBar />
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
            <div className="mt-3">
                <Typography variant="body1" component="h1" sx={{ flexGrow: 1, fontSize: 18 }}>
                    Debes iniciar sesión para ver esta página
                </Typography>
                <Button variant="outlined"
                    onClick={() => void signIn('azure-ad')}
                >
                    Iniciar sesión
                </Button>
            </div>
        </Container>
    </div>
}

function LoadingRoute() {
    return <div>
        <Head>
            <title>Cargando</title>
        </Head>
        <SignedInAppBar />
        <div className="fixed flex top-0 bottom-0 left-0 right-0 align-middle justify-center">
            <CircularProgress sx={{ alignSelf: 'center' }} size={60} />
        </div>
    </div>
}


export function SignedInAppBar() {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ backgroundColor: '#111' }} elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Comunicaciones
                    </Typography>
                    <Button color="inherit"
                        onClick={() => void signOut()}
                    >Salir</Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}


export function SignedOutAppBar() {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ backgroundColor: '#111' }} elevation={1}>
                <Toolbar>
                    {/* <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton> */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Comunicaciones
                    </Typography>
                    <Button color="inherit"
                        onClick={() => void signIn('azure-ad')}
                    >Acceder</Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}