import Link from "next/link";
import { api, type RouterOutputs } from "~/utils/api";

interface Props {
  communications: RouterOutputs['getMyCommunications'];
}

export default function Communications(props: Props) {
  return (
    <div>
      {props.communications?.map(communication => (
        <div key={communication.id} className="p-2 border mt-2 rounded-md">
          <Link
            className="text-blue-500"
            href={"/estudiante/" + communication.studentEnrolment}
          >
            {communication.studentEnrolment} - {communication.student?.name || '<sin nombre>'} ({communication.student?.coursingYear}°)
          </Link>
          <p>{communication.message}</p>
          <p className="text-sm font-bold">{communication.timestamp.toLocaleString()}</p>
          <p>{communication.comment}</p>
        </div>
      ))}
    </div>
  );
}