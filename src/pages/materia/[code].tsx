import { type NextPage } from "next";
import Head from "next/head";

import Layout from "~/lib/layout";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { subjectMenu } from "~/lib/menus";
import { useMemo } from "react";
import Communications from "~/lib/components/Communications";

const Home: NextPage = () => {
    const router = useRouter()
    const code = router.query.code?.toString()
    const { data: subject } = api.getSubject.useQuery(code || '', { enabled: !!code })
    const { data: communications } = api.getCommunications.useQuery()

    const filteredCommunications = useMemo(() => {
        return communications?.filter(communication => communication.subjectCode === code)
    }, [communications, code])

    return (
        <>
            <Head>
                <title>{!subject ? code : subject.name}</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {code && <Layout
                title={!subject ? code : subject.name}
                menu={subject ? subjectMenu(subject?.courseYear, code) : []}
                nav={[]}
            >
                <h1 className="text-xl">{subject?.name}</h1>
                {(filteredCommunications && filteredCommunications.length > 0) && <>
                    <h2 className="text-lg mt-2">Últimas comunicaciones</h2>
                    <Communications communications={filteredCommunications} />
                </>}
            </Layout>}
        </>
    );
};

export default Home