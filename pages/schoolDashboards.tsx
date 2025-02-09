import { copy } from "@/lib/copy";
import React from "react";
import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from "@/components/buttons.components";

export default function page() {
  return (
    <div className="flex flex-col items-center p-8 justify-center text-base-content">
      <h1 className="text-5xl m-5">{copy.components.school.title}</h1>
      <div className=" prose ">{copy.components.school.copy}</div>
      <div className="flex flex-row items-center justify-center">
        <LoginButton />
        <RegisterButton />
        <LogoutButton />
        <ProfileButton />
      </div>
    </div>
  );
}
