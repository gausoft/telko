import type { SubmissionEnv } from '../../src/server/env-types';
import { handleSubmission } from '../../src/server/handle-submission';

/** Cloudflare Pages Function: POST /api/contribute. Thin on purpose, the logic lives in src/server. */
export const onRequestPost = ({ request, env }: { request: Request; env: SubmissionEnv }): Promise<Response> => handleSubmission(request, env);
