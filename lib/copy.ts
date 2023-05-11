import { linkItemsList } from "@/components/HeaderNav";
import { CgWebsite } from "react-icons/cg";
import { BsFillCameraFill } from "react-icons/bs";

export const copy = {
  components: {
    BoskindDigital: {
      title: "Boskind Digital",
      llc: "Boskind Digital LLC",
      subTitle: "Web Development and Design",
      photography: "Photography",
      welcome: "Welcome to Boskind Digital",
      // large block of copy about web development and photography services
      copy: `Boskind Digital is a web development and design company based in
      Derby, Vermont. We specialize in building websites for small businesses
      and individuals. We also offer photography services for events, portraits,
      and real estate.`,
    },

    footer: {
      contactMe: "Contact Me",
    },
  },
};

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
