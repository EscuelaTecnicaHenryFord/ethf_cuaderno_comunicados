import { type NextPage } from "next";
import Head from "next/head";

import Layout from "~/lib/layout";
import { useRouter } from "next/router";
import { coursesSubMenu } from "~/lib/menus";
import { api } from "~/utils/api";
import Link from "next/link";
import { useMemo } from "react";
import Communications from "~/lib/components/Communications";

const Home: NextPage = () => {
    const router = useRouter()
    const enrolment = router.query.enrolment?.toString()
    const materia = router.query.materia?.toString()
    const { data: student } = api.getStudent.useQuery(enrolment || '', { enabled: !!enrolment })
    const { data: communications } = api.getMyCommunications.useQuery()

    const filteredCommunications = useMemo(() => {
        return communications?.filter(communication => communication.studentEnrolment === enrolment)
    }, [communications, enrolment])

    return (
        <>
            <Head>
                <title>{student ? `${enrolment || ''} - ${student.name}` : enrolment}</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {enrolment && <Layout
                title={student ? `${enrolment} - ${student.name}` : enrolment}
                menu={[
                    {
                        label: 'Inicio',
                        href: '/',
                    },
                    {
                        label: 'Mis comunicaciones',
                        href: '/mis-comunicaciones',
                    },
                    {
                        label: 'Mis materias',
                        href: '/mis-materias',
                    },
                ]}
                nav={[]}
            >
                <h1 className="text-xl mt-2">{student?.name}</h1>
                <Link href={{
                    pathname: '/nueva-comunicacion',
                    query: {
                        enrolment,
                        curso: student?.coursingYear,
                        materia,
                    }
                }}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-2 text-center"
                >Nueva comunicación</Link>
                {(filteredCommunications && filteredCommunications.length > 0) && <>
                    <h2 className="text-lg">Últimas comunicaciones</h2>
                    <Communications communications={filteredCommunications} />
                </>}
            </Layout>}
        </>
    );
};

export default Home