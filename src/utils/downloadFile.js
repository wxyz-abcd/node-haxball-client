
export const downloadFile = (fileName, blobType, blobContents) => {
    var c = window.document.createElement("a");
    c.style.display = "display: none";
    window.document.body.appendChild(c);
    var d = URL.createObjectURL(new Blob([blobContents], { type: blobType }));
    c.href = d;
    c.download = fileName;
    c.click();
    URL.revokeObjectURL(d);
    c.remove();
}