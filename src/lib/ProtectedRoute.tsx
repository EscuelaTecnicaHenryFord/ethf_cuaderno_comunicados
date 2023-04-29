import { signIn, signOut, useSession } from "next-auth/react"
import { useUserRole } from "./util/useUserRole"
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

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
            {children}
        </>
    }

    return <NotAllowedRoute />
}

function NotAllowedRoute() {
    return <div>
        <SignedInAppBar />
        <h1 className="text-center mt-5 font-xl">
            No tienes permiso para ver esta página
        </h1>
    </div>
}

function SignedOutRoute() {
    return <div>
        <SignedOutAppBar />
        <Container>
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
        <SignedInAppBar />
        <div className="fixed flex top-0 bottom-0 left-0 right-0 align-middle justify-center">
            <CircularProgress sx={{ alignSelf: 'center' }} size={60} />
        </div>
    </div>
}


export function SignedInAppBar() {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
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
            <AppBar position="static">
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