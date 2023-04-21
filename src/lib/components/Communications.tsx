import Link from "next/link";
import { api, type RouterOutputs } from "~/utils/api";

interface Props {
  communications: RouterOutputs['getCommunications'];
}

export default function Communications(props: Props) {
  return (
    <div>
      {props.communications?.map(communication => (
        <div key={communication.id} className={"p-2 border mt-2 rounded-md" + (communication.isMine ? " border-blue-500" : "")}>
          {!communication.isMine && <div>
            <p className="text-sm font-bold text-white bg-blue-500 inline-block px-1 rounded-md">{communication.teacher?.name || communication.teacherEmail}</p>
          </div>}
          <Link
            className="text-blue-500"
            href={"/estudiante/" + communication.studentEnrolment}
          >
            {communication.studentEnrolment} - {communication.student?.name || '<sin nombre>'} ({communication.student?.coursingYear}°)
          </Link>
          <p className="text-sm text-gray-500 font-bold">En la clase de {communication.subject?.name}:</p>
          <p>{communication.message}</p>
          <p className="text-sm font-bold my-1 text-green-600">{communication.timestamp.toLocaleString()}</p>
          <p>{communication.comment}</p>
        </div>
      ))}
    </div>
  );
}