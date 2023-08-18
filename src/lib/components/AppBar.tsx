import { styled, alpha } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import React, { useState } from 'react'
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { nameInitials, stringAvatar } from '../util/nameUtils';
import { useUserRole } from '../util/useUserRole';
import { Chip } from '@mui/material';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
                width: '20ch',
            },
        },
    },
}));

export default function AppBar({ onSearch }: { onSearch?: ((query: string) => unknown) | null }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const role = useUserRole()

    const { data: session } = useSession();

    return (
        <React.Fragment>
            <Drawer
                anchor='left'
                open={open}
                onClose={() => setOpen(false)}
            >
                <Box
                    sx={{ width: 300, maxWidth: '100%' }}
                    role="presentation"
                    onClick={() => setOpen(false)}
                    onKeyDown={() => setOpen(false)}
                >
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton>
                                <ListItemIcon>
                                    <AccountCircleIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={session?.user.name}
                                    secondary={
                                        <React.Fragment>
                                            <Typography
                                                sx={{ display: 'inline' }}
                                                component="span"
                                                variant="body2"
                                                color="text.primary"
                                            >
                                                {session?.user.email}
                                            </Typography>
                                        </React.Fragment>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                        {role.isAdmin && <ListItem disablePadding>
                            <div className='flex justify-around w-full pr-5'>
                                <Chip label="Administrador" variant='outlined' />
                            </div>
                        </ListItem>}
                    </List>
                    <Divider />
                    <List>
                        <ListItem disablePadding onClick={() => void router.push('/')}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <HomeIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Inicio"} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding onClick={() => void router.push('/comunicaciones')}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <ListAltIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Comunicaciones"} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding onClick={() => void router.push('/nueva-comunicacion')}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <AddIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Nueva comunicación"} />
                            </ListItemButton>
                        </ListItem>
                        {role.isAdmin && <ListItem disablePadding onClick={() => void router.push('/settings')}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <SettingsIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Configuración"} />
                            </ListItemButton>
                        </ListItem>}
                    </List>
                    <Divider />
                    <List>
                        <ListItem disablePadding onClick={() => void signOut()}>
                            <ListItemButton>
                                <ListItemIcon>
                                    <ExitToAppIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Cerrar sesión"} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            <Box sx={{ flexGrow: 1, zIndex: 2 }}>
                <MuiAppBar position="static" sx={{backgroundColor: '#111'}}>
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            sx={{ mr: 2 }}
                            onClick={() => setOpen(true)}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{ flexGrow: 1 }}
                        >
                            Comunicaciones
                        </Typography>
                        {onSearch && <Search>
                            <SearchIconWrapper>
                                <SearchIcon />
                            </SearchIconWrapper>
                            <StyledInputBase
                                onChange={e => onSearch(e.target.value?.toString() || '')}
                                placeholder="Buscar..."
                                inputProps={{ 'aria-label': 'search' }}
                            />
                        </Search>}
                        {!onSearch && <Avatar {...stringAvatar(session?.user.name || 'H F')} />}
                        {/* <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="signout"
                            sx={{ mr: 2 }}
                            onClick={() => void signOut()}
                        >
                            <ExitToAppIcon />
                        </IconButton> */}
                        {/* <Search>
                            <SearchIconWrapper>
                                <SearchIcon />
                            </SearchIconWrapper>
                            <StyledInputBase
                                placeholder="Buscar..."
                                inputProps={{ 'aria-label': 'search' }}
                            />
                        </Search> */}
                    </Toolbar>
                </MuiAppBar>
            </Box>
        </React.Fragment>
    );
}