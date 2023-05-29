import { linkItemsList } from "@/components/HeaderNav";
import { CgWebsite } from "react-icons/cg";
import { BsFillCameraFill } from "react-icons/bs";
import { FaSchool } from "react-icons/fa";
import { MdOutlineEngineering } from "react-icons/md";

export const copy = {
  components: {
    BoskindDigital: {
      title: "Boskind Digital",
      llc: "Boskind Digital LLC",
      subTitle: "Web Development and Design",
      photography: "Photography",
      welcome: "Welcome to Boskind Digital",
      // large block of copy about web development and photography services
      copy: `Boskind Digital is a web development and design company based in Derby, Vermont. We specialize in building websites for small businesses and individuals. We also offer photography services for events, portraits, and real estate.`,
    },

    photography: {
      title: "Photography",
      existingWork: "You can find some of my existing work here: ",
      NekPics: "NekPics.com",
    },

    webdev: {
      title: "Web Development",
      subTitle: "Custom Websites and School Dashboards",
      copy: `I build custom websites for small businesses and individuals. I also build school dashboards for schools that use the PowerSchool SIS. I am a certified PowerSchool developer and have built many dashboards for schools in Vermont and New Hampshire.`,
    },

    school: {
      title: "School Dashboards",
      subTitle: "PowerSchool Customizations",
      copy: `I build custom dashboards for schools that use the PowerSchool SIS. I am a certified PowerSchool developer and have built many dashboards for schools in Vermont and New Hampshire.`,
    },
    footer: {
      contactMe: "Contact Me",
    },
  },
};

export const headerLinks: linkItemsList = [
  {
    label: "Web Development",
    href: "/webdev",
    icon: CgWebsite,
    subItems: [
      {
        label: "Custom Websites",
        href: "/webdev",
        icon: MdOutlineEngineering,
      },
      {
        label: "School Dashboards",
        href: "/schoolDashboards",
        icon: FaSchool,
      },
    ],
  },
  {
    label: "Photography",
    href: "/photography",
    icon: BsFillCameraFill,
  },
];
