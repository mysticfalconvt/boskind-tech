import { linkItemsList } from "@/components/HeaderNav";
import { CgWebsite } from "react-icons/cg";
import { BsFillCameraFill } from "react-icons/bs";

export const headerLinks: linkItemsList = [
  {
    label: "Web Development",
    href: "/web-development",
    icon: CgWebsite,
    subItems: [
      {
        label: "Development",
        href: "/web-development",
        icon: CgWebsite,
      },
      {
        label: "Web Design",
        href: "/web-design",
        icon: CgWebsite,
      },
    ],
  },
  {
    label: "Photography",
    href: "/photography",
    icon: BsFillCameraFill,
  },
];
