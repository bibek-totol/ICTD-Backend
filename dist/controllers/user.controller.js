export {};
// import { pool } from "../config/db";
// import { AuthRequest } from "../middlewares/auth.m";
// export const getUsers = async (req: AuthRequest, res: Response) => {
//   try {
//     const result = await pool.query(`SELECT * FROM users`);
//     return res.status(200).json({
//       success: true,
//       message: "all data retrieve successfully",
//       data: result.rows,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// export const getUserDetails = async (req: AuthRequest, res: Response) => {
//   try {
//     const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [
//       req.params.userId,
//     ]);
//     if (result.rows.length === 0) {
//       res.status(500).json({
//         success: false,
//         message: "user not found",
//       });
//     } else {
//       res.status(500).json({
//         success: true,
//         message: "data retrieve successfully",
//         data: result.rows[0],
//       });
//     }
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// export const updateUser = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.params.userId;
//     const { name, email, password, phone } = req.body;
//     if (!name || !email || !phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, email and phone are required",
//       });
//     }
//     const existing = await pool.query(`SELECT * FROM users WHERE id = $1`, [
//       userId,
//     ]);
//     if (existing.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     // Hash password only if provided
//     let hashedPassword = existing.rows[0].password;
//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       hashedPassword = await bcrypt.hash(password, salt);
//     }
//     // Update all fields except role
//     const result = await pool.query(
//       `UPDATE users 
//        SET name = $1,
//            email = $2,
//            password = $3,
//            phone = $4,
//            updated_at = NOW()
//        WHERE id = $5
//        RETURNING id, name, email, phone, role, created_at, updated_at`,
//       [name, email, hashedPassword, phone, userId]
//     );
//     return res.status(200).json({
//       success: true,
//       message: "User updated successfully",
//       data: result.rows[0],
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// export const deleteUser = async (req: AuthRequest, res: Response) => {
//   try {
//     const result = await pool.query(`DELETE FROM users WHERE id = $1`, [
//       req.params.userId,
//     ]);
//     if (result.rowCount === 0) {
//       res.status(500).json({
//         success: false,
//         message: "user not found",
//       });
//     } else {
//       res.status(500).json({
//         success: true,
//         message: "data deleted successfully",
//         data: null,
//       });
//     }
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
