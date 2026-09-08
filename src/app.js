window.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const { examples, buildBrief, privacyWarnings } = window.EverydayBrief;
  const form = document.querySelector("#brief-form");
  const output = document.querySelector("#brief-output");
  const status = document.querySelector("#status");
  const warnings = document.querySelector("#privacy-warnings");
  const error = document.querySelector("#form-error");
  const copyButton = document.querySelector("#copy");
  const downloadButton = document.querySelector("#download");
  const fields = ["goal", "context", "materials", "format"];
  let example = "meeting";
  let currentBrief = "";

  function readInput() {
    return Object.fromEntries([
      ["example", example],
      ...fields.map((key) => [key, form.elements.namedItem(key).value])
    ]);
  }

  function render() {
    error.textContent = "";
    status.textContent = "";
    form.elements.namedItem("goal").removeAttribute("aria-invalid");
    const input = readInput();
    warnings.replaceChildren(...privacyWarnings(input).map((message) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      return paragraph;
    }));
    try {
      currentBrief = buildBrief(input);
      output.textContent = currentBrief;
      copyButton.disabled = false;
      downloadButton.disabled = false;
    } catch (cause) {
      if (!(cause instanceof TypeError || cause instanceof RangeError)) throw cause;
      currentBrief = "";
      output.textContent = "Add a task on the left to build your brief.";
      error.textContent = cause.message;
      form.elements.namedItem("goal").setAttribute("aria-invalid", "true");
      copyButton.disabled = true;
      downloadButton.disabled = true;
    }
  }

  function loadExample(name) {
    example = name;
    for (const field of fields) form.elements.namedItem(field).value = examples[name][field];
    for (const button of document.querySelectorAll("[data-example]")) {
      button.setAttribute("aria-pressed", String(button.dataset.example === name));
    }
    document.querySelector("#task-label").textContent = examples[name].name;
    render();
  }

  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => loadExample(button.dataset.example));
  });
  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    if (currentBrief) output.focus();
  });

  copyButton.addEventListener("click", async () => {
    if (!currentBrief) {
      status.textContent = "Add a task before copying.";
      return;
    }
    if (warnings.childElementCount) {
      status.textContent = "Remove the flagged identifying details or credentials before copying.";
      warnings.focus();
      return;
    }
    if (!navigator.clipboard?.writeText) {
      status.textContent = "Clipboard access is unavailable here. Use Download .txt, or select the brief and copy it manually.";
      output.focus();
      return;
    }
    try {
      await navigator.clipboard.writeText(currentBrief);
      status.textContent = "Copied. Review the brief before pasting it into your chosen AI service.";
    } catch (cause) {
      if (!(cause instanceof DOMException) || cause.name !== "NotAllowedError") throw cause;
      status.textContent = "Clipboard permission was denied. Use Download .txt, or select the brief and copy it manually.";
      output.focus();
    }
  });

  downloadButton.addEventListener("click", () => {
    if (!currentBrief) {
      status.textContent = "Add a task before downloading.";
      return;
    }
    const file = new Blob([currentBrief + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-ai-task-brief.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Downloaded locally. Nothing was uploaded.";
  });

  document.querySelector("#clear").addEventListener("click", () => {
    for (const field of fields) form.elements.namedItem(field).value = "";
    render();
    form.elements.namedItem("goal").focus();
    status.textContent = "Fields cleared. This tool does not save your input.";
  });

  loadExample(example);

  document.fonts.ready.then(() => {
    const { prepare, layout } = window.Pretext;
    const elements = [...document.querySelectorAll("[data-pretext]")];
    const handles = new Map(elements.map((element) => [
      element, prepare(element.textContent, getComputedStyle(element).font)
    ]));
    function relayout() {
      for (const element of elements) {
        const { height } = layout(
          handles.get(element),
          element.clientWidth,
          Number.parseFloat(getComputedStyle(element).lineHeight)
        );
        element.style.minHeight = `${Math.ceil(height)}px`;
      }
    }
    new ResizeObserver(relayout).observe(document.querySelector("main"));
    relayout();
  });
}, { once: true });
