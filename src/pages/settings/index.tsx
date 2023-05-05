import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { useMainMenu } from "~/lib/menus";

import Editor from '@monaco-editor/react';
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import ProtectedRoute from "~/lib/ProtectedRoute";
import SearchAppBar from "~/lib/components/AppBar";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import { Button, Dialog, DialogContentText, DialogContent } from "@mui/material";


export default function SettingsFileEditorWrapper() {
  return <ProtectedRoute requiredAdmin>
    <SettingsFileEditor />
  </ProtectedRoute>
}

function SettingsFileEditor() {

  const router = useRouter()

  const filename = router.query.filename?.toString()

  const { data } = api.getFile.useQuery(filename || '', { enabled: !!filename })

  const { mutateAsync: saveFile } = api.saveFile.useMutation()

  const [content, setContent] = useState<string | null>(null)

  return <div>
    <SearchAppBar />
    <MultiFileView />
  </div>
}

function FileEditor(props: { filename: string }) {
  const filename = props.filename

  const { data, refetch } = api.getFile.useQuery(filename, { cacheTime: 0 })

  const { mutateAsync: saveFile } = api.saveFile.useMutation()

  const [content, setContent] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const save = useCallback(() => {
    console.log(content)
    if (content == null) return
    void saveFile({
      filename: filename || '',
      content: content,
    }).then(() => {
      alert("Guardado correctamente")
      void refetch()
    }).catch(e => {
      const message = (!!e ? (e as unknown as { message: string }).message : "Error desconocido")
      setError(message)
    })
  }, [content, filename, refetch, saveFile])

  useEffect(() => {

    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        // Prevent the Save dialog to open
        e.preventDefault();
        // Place your code here
        console.log('CTRL + S');
        save()
      }
    }

    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    }
  }, [save])

  return (
    <>
      <Dialog
        open={!!error}
        onClose={() => setError('')}
      >
        <DialogTitle id="alert-dialog-title">
          {"Ocurrion un error al guardar, revise el formato"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {error}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setError('')} autoFocus>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <div className="fixed top-[105px] sm:top-[113px] left-0 right-0 bottom-0">
        <Editor height="100%" defaultLanguage="json" defaultValue={data} key={(data != undefined && data != null) ? filename : 0} onChange={v => setContent(v || null)} />
      </div>
      <div className="fixed right-2 bottom-2">
        <Button variant="outlined" onClick={save}>
          Guardar
        </Button>
      </div>
    </>
  );
}




interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function MultiFileView() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          aria-label="scrollable force tabs example"
        >
          <Tab label="General" {...a11yProps(0)} />
          <Tab label="Docentes" {...a11yProps(1)} />
          <Tab label="Materias" {...a11yProps(2)} />
          <Tab label="Estudiantes" {...a11yProps(3)} />
        </Tabs>
      </Box>
      {['general.json', 'teachers.json', 'subjects.json', 'students.json'].map((filename, i) => {

        return <TabPanel value={value} index={i} key={i}>
          <FileEditor filename={filename} />
        </TabPanel>
      })}
    </Box>
  );
}