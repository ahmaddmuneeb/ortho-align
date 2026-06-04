/**
 * @swagger
 * /api/patient/me:
 *   get:
 *     tags: [Patient Portal]
 *     summary: Get current patient portal user and linked patient record
 *     responses:
 *       200:
 *         description: User and linked patient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - PATIENT role required
 *
 * /api/patient/cases:
 *   get:
 *     tags: [Patient Portal]
 *     summary: List cases for linked patient (read-only)
 *     responses:
 *       200:
 *         description: Cases for this patient
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cases:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 * /api/patient/cases/{id}:
 *   get:
 *     tags: [Patient Portal]
 *     summary: Get case detail if it belongs to linked patient
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Case detail including workflow timeline
 *       404:
 *         description: Case not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 * /api/patient/cases/{id}/files:
 *   get:
 *     tags: [Patient Portal]
 *     summary: List case files (read-only, download URLs)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Case files
 *       404:
 *         description: Case not found
 *
 * /api/patient/cases/{id}/comments:
 *   get:
 *     tags: [Patient Portal]
 *     summary: List non-internal comments on case (read-only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: External comments only
 *       404:
 *         description: Case not found
 */
