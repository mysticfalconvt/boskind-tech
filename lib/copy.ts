import { linkItemsList } from '@/components/HeaderNav';
import {
  BsFillCameraFill,
  BsPersonBadge,
  BsPersonVcardFill,
} from 'react-icons/bs';
import { CgWebsite } from 'react-icons/cg';
import { FaMicroblog, FaSchool } from 'react-icons/fa';
import { MdEmojiObjects, MdOutlineEngineering } from 'react-icons/md';

export const copy = {
  components: {
    BoskindDigital: {
      title: 'Boskind Digital',
      llc: 'Boskind Digital LLC',
      subTitle: 'Web Development and Design',
      photography: 'Photography',
      welcome: 'Welcome to Boskind Digital',
      // large block of copy about web development and photography services
      copy: `Boskind Digital is a web development and design company based in Derby, Vermont. We specialize in building websites for small businesses and individuals. We also offer photography services for events, portraits, and real estate.`,
    },

    photography: {
      title: 'Photography',
      existingWork: 'You can find some of my existing work here: ',
      NekPics: 'NekPics.com',
    },

    webdev: {
      title: 'Web Development',
      subTitle: 'Custom Websites, Hosting, and SEO',
      description: `I build custom websites for small businesses and individuals. I can create a website for you from scratch or I can help you update your existing website.
      Search Engine Optimization (SEO) is a key component of any website. I can help you improve your SEO and get your website to the top of the search results.
      `,
      contact: 'Contact Me!',
    },

    school: {
      title: 'School Dashboards',
      subTitle: 'PowerSchool Customizations',
      copy: `I build custom dashboards for schools that use the PowerSchool SIS. I am a certified PowerSchool developer and have built many dashboards for schools in Vermont and New Hampshire.`,
    },
    footer: {
      contactMe: 'Contact Me',
    },
  },
};

export const headerLinks: linkItemsList = [
  {
    label: 'Web Development',
    href: '/webdev',
    icon: CgWebsite,
    subItems: [
      {
        label: 'Custom Websites',
        href: '/webdev',
        icon: MdOutlineEngineering,
      },
      {
        label: 'School Dashboards',
        href: '/schoolDashboards',
        icon: FaSchool,
      },
      {
        label: 'Little Demos',
        href: '/demos',
        icon: MdEmojiObjects,
      },
    ],
  },
  {
    label: 'Personal',
    href: '/personal',
    icon: BsPersonVcardFill,
    subItems: [
      {
        label: 'Photography',
        href: '/photography',
        icon: BsFillCameraFill,
      },
      {
        label: 'Blog',
        href: '/blog',
        icon: FaMicroblog,
      },
      {
        label: 'Portfolio',
        href: '/portfolio',
        icon: BsPersonBadge,
      },
    ],
  },
];
