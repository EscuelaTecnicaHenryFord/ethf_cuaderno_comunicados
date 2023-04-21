import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import Layout from "~/lib/layout";
import { useMainMenu } from "~/lib/menus";

import Editor from '@monaco-editor/react';
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const Home: NextPage = () => {
  const { data: courses } = api.getCourses.useQuery(undefined, { cacheTime: 0, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false })

  const router = useRouter()

  const filename = router.query.filename?.toString()

  const { data } = api.getFile.useQuery(filename || '', { enabled: !!filename })

  const { mutateAsync: saveFile } = api.saveFile.useMutation()

  const mainMenu = useMainMenu(courses)

  const [content, setContent] = useState<string | null>(null)

  function save() {
    if (content == null) return
    void saveFile({
      filename: filename || '',
      content: content,
    })
  }

  console.log(data)

  return (
    <>
      <Head>
        <title>Todas las comunicaciones</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout
        title="Inicio"
        menu={mainMenu}
        nav={[]}
      >
        <div className="flex gap-4">
          <Link href="/settings/general.json" className="text-sm text-blue-500">General</Link>
          <Link href="/settings/teachers.json" className="text-sm text-blue-500">Docentes</Link>
          <Link href="/settings/students.json" className="text-sm text-blue-500">Estudiantes</Link>
          <Link href="/settings/subjects.json" className="text-sm text-blue-500">Materias</Link>
          <span className="w-full"></span>
          <button className="text-sm text-blue-500" onClick={save}>Guardar</button>
        </div>
        <div className="border p-1">
          <Editor height="calc(100vh - 140px)" defaultLanguage="json" defaultValue={data} key={(data != undefined && data != null) ? filename : 0} onChange={v => setContent(v || null)} />
        </div>
      </Layout>
    </>
  );
};

export default Home

