/** jsdom doesn't implement modal dialogs, so components using <dialog> need this before rendering. */
export function stubModalDialogs() {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
}
