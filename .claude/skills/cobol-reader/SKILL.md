---
name: cobol-reader
description: >
  Analyze, explain, or improve COBOL/JCL source code. Triggered when the user
  pastes COBOL code, asks about mainframe topics (JCL, VSAM, DB2, ISPF, TSO, z/OS),
  or asks to "read this COBOL", "explain this program", "add COBOL feature".
---

# Skill: COBOL Reader & IBM Mainframe Analyzer

## Context
The user is preparing for an IBM Mainframe onsite in Japan. COBOL files may be
pasted into the `/learn/mainframe` page textarea, or provided directly in chat.
The ChatBox on that page uses `context: "cobol"` which loads the COBOL system prompt.

## COBOL Structure — always explain in this order
1. **IDENTIFICATION DIVISION** — Program name, author, metadata
2. **ENVIRONMENT DIVISION** — System config, file assignments (SELECT … ASSIGN)
3. **DATA DIVISION** — Variables: WORKING-STORAGE, LINKAGE, FILE sections
4. **PROCEDURE DIVISION** — Business logic: paragraphs, PERFORM, IF, EVALUATE

## PIC clause reference
| Clause | Meaning |
|--------|---------|
| `PIC X(n)` | Alphanumeric, n bytes |
| `PIC 9(n)` | Unsigned numeric, n digits |
| `PIC S9(n)` | Signed numeric |
| `PIC S9(n)V9(m)` | Signed decimal (n integer, m fractional digits) |
| `PIC S9(n) COMP-3` | Packed decimal (efficient storage) |
| `PIC S9(n) COMP` | Binary integer |

## Common patterns to identify
- **Batch file processing**: OPEN INPUT → READ → process loop → WRITE → CLOSE
- **VSAM access**: KSDS (keyed), ESDS (sequential), RRDS (relative)
- **DB2 embedded SQL**: `EXEC SQL SELECT ... INTO :host-var END-EXEC`
- **COPY books**: `COPY CUSTFILE.` — shared data definitions
- **Conditional logic**: `IF ... ELSE ... END-IF` or `EVALUATE ... WHEN ... END-EVALUATE`
- **Subprogram calls**: `CALL 'PGMNAME' USING WS-PARM`

## When explaining code
1. Give a 1-sentence summary: "This program reads customer records from FILE-A and writes summaries to FILE-B."
2. Walk through each DIVISION briefly.
3. Highlight the PROCEDURE DIVISION main logic flow.
4. Flag any issues: missing `STOP RUN`, unclosed `IF`, deprecated syntax.
5. Suggest improvements with modern COBOL best practices.

## When generating COBOL
- Use proper column alignment (Area A: col 8-11, Area B: col 12-72)
- Always include all 4 divisions
- Use `END-IF`, `END-PERFORM`, `END-EVALUATE` (structured terminators)
- Prefer `EVALUATE` over nested `IF` for clarity
- Add meaningful paragraph names: `1000-MAIN-PARA`, `2000-PROCESS-RECORD`, `9999-EXIT`

## JCL patterns
```jcl
//JOBNAME  JOB (ACCT),'DESCRIPTION',CLASS=A,MSGCLASS=X
//STEP1    EXEC PGM=COBPGM
//SYSOUT   DD SYSOUT=*
//INFILE   DD DSN=MY.INPUT.FILE,DISP=SHR
//OUTFILE  DD DSN=MY.OUTPUT.FILE,DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,1)),DCB=(RECFM=FB,LRECL=80,BLKSIZE=8000)
```

## IBM docs to reference
- COBOL Language: https://www.ibm.com/docs/en/cobol-zos
- JCL Reference: https://www.ibm.com/docs/en/zos/latest?topic=jcl
- DB2 for z/OS: https://www.ibm.com/docs/en/db2-for-zos
