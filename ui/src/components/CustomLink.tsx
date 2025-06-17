import React from "react";
import { Link, LinkProps } from "@mui/material";
import { useNavigate, useHref, type To } from "react-router-dom";

interface CustomLinkProps extends Omit<LinkProps, "href"> {
  to: To;
}

const isModifiedEvent = (event: React.MouseEvent) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

const isLeftClickEvent = (event: React.MouseEvent) => event.button === 0;

const isTargetBlank = (event: React.MouseEvent) => {
  const target = (event.target as Element).getAttribute("target");
  return target && target !== "_self";
};

export default function CustomLink({ to, ...rest }: CustomLinkProps) {
  const navigate = useNavigate();

  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.defaultPrevented) {
      return;
    }

    if (
      isModifiedEvent(event) ||
      !isLeftClickEvent(event) ||
      isTargetBlank(event)
    ) {
      return;
    }

    event.preventDefault();

    navigate(to);
  };

  const href = useHref(to);

  return <Link {...rest} href={href} onClick={onClick} />;
}
