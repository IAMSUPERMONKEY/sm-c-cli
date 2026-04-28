#!/usr/bin/env node
import { createProgram } from './cli/program.js';

await createProgram().parseAsync(process.argv);
