import { useRef, useEffect } from "react";
import "./dropDown.css";

export default function DropDown({
  title,
  onSelect,
  defaultValue,
  content,
  class1,
  class2,
}) {
  const dropDownRef = useRef(null);

  useEffect(() => {
    if (!dropDownRef.current) return;
    if (!content || content.length === 0) return;
    if (!class1) class1 = "defaultClass1";
    if (!class2) class2 = "defaultClass2";

    var selectorPopup = document.createElement("div");
    selectorPopup.className = "dropDownPopup";

    var options = content.reduce((x, content) => {
      x +=
        `<div class='elem'><div class='${class1} ${class2}-` +
        content.abbr +
        `' data-id='` +
        content.abbr +
        `'></div> ` +
        content.name +
        `</div>`;
      return x;
    }, "");
    selectorPopup.innerHTML = options;

    for (var i = 0; i < selectorPopup.children.length; i++) {
      var o = selectorPopup.children[i];
      o.onclick = (e) => {
        e.stopPropagation();
        const flag = e.currentTarget.children[0]
          .getAttribute("data-id")
          .toLowerCase();

        dropDownRef.current.value = flag;
        onSelect && onSelect(flag);
        selectorPopup.style.visibility = "hidden"; // cerrar al seleccionar
      };
    }

    dropDownRef.current.classList.add("dropDown");

    var selectorContents = document.createElement("div");
    selectorContents.className = "dropDownContents";

    Object.defineProperty(dropDownRef.current, "value", {
      get: () => dropDownRef.current.getAttribute("value"),
      set: (v) => {
        dropDownRef.current.setAttribute("value", v);
        selectorPopup.style.visibility = "hidden";
        updateSelectorContents();
      },
    });

    var updateSelectorContents = function () {
      if (!dropDownRef.current) return;
      if (!content || content.length === 0) return;
      var el = dropDownRef.current.value;
      var selected = content.find((x) => x.abbr === el);
      if (!selected) {
        selectorContents.innerHTML = "<div class='elem'></div>";
        return;
      }
      selectorContents.innerHTML =
        `<div class='elem'><div class='${class1} ${class2}-` +
        selected.abbr +
        `' data-id='` +
        selected.abbr +
        `'></div> ` +
        selected.name +
        `</div>`;
      for (var i = 0; i < selectorPopup.children.length; i++) {
        var o = selectorPopup.children[i];
        var f = o.children[0].getAttribute("data-id")?.toLowerCase();
        if (f === el) o.classList.add("selected");
        else o.classList.remove("selected");
      }
    };

    dropDownRef.current.appendChild(selectorContents);
    dropDownRef.current.appendChild(selectorPopup);

    // abrir popup al click
    dropDownRef.current.onclick = function (e) {
      e.stopPropagation(); // para que no se cierre al abrir
      selectorPopup.style.visibility = "visible";
    };

    // cerrar popup al hacer click fuera
    const handleClickOutside = (e) => {
      if (dropDownRef.current && !dropDownRef.current.contains(e.target)) {
        selectorPopup.style.visibility = "hidden";
      }
    };
    document.addEventListener("click", handleClickOutside);

    updateSelectorContents();

    // cleanup
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropDownRef]);

  return (
    <div>
      {title}
      <div ref={dropDownRef} value={defaultValue}></div>
    </div>
  );
}
