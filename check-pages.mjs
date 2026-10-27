import {verifyPages} from './pages-audit.mjs';
import {fileURLToPath} from 'node:url';
const result = await verifyPages(fileURLToPath(new URL('./cloudflare-pages/', import.meta.url)));
console.log(`PASS: ${result.files.length} files; ${result.routes.length} direct/refresh routes; ${result.checkedReferences} references; all assets local and <= 25 MiB; both CVs and media signatures valid.`);
