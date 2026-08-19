export function parseCsvRecords(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;

  const pushRow = () => {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
    row = [];
    field = "";
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (closedQuote) {
      if (character === ",") {
        row.push(field);
        field = "";
        closedQuote = false;
      } else if (character === "\r" || character === "\n") {
        pushRow();
        closedQuote = false;
        if (character === "\r" && input[index + 1] === "\n") {
          index += 1;
        }
      } else if (character !== " " && character !== "\t") {
        return null;
      }
      continue;
    }

    if (character === '"') {
      if (field !== "") {
        return null;
      }
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\r" || character === "\n") {
      pushRow();
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
    } else {
      field += character;
    }
  }

  if (quoted) {
    return null;
  }
  if (closedQuote || field !== "" || row.length > 0) {
    pushRow();
  }
  return rows;
}
