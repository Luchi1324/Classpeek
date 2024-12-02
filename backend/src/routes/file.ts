import { Router } from 'express';
import { FileService } from '../services/fileService';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const fileService = new FileService();

// Get all
router.get("/files", async (req, res) => {
    try {
      const { user_id } = req.query;
  
      const files = await fileService.getFiles({
        user_id: Number(user_id)
      });
  
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

// Get
router.get("/files/:title", async (req, res) => {
    try {
      const { user_id, title } = req.query;
  
      const files = await fileService.getFile({
        user_id: Number(user_id),
        title: title ? title.toString() : "" 
      });
  
      res.json(files);
    } catch (error) {
      console.error("Error getting files:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

// Create
router.post("/files", requireAuth, (req, res) => {
  const createFile = async () => {
    try {
      const { title, type, content } = req.body;
      const userId = req.session?.userId; // Get user ID from session

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const file = await fileService.createFile({
        title: title,
        type: type,
        content: content,
        user_id:userId,
      });

      console.log("File created from payload: ", req.body)

      res.json(file);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  }
  createFile();
});

// Delete
router.delete("/comments/:id", requireAuth, async (req, res) => {
    try {
    const { user_id, title} = req.body;
      const result = await fileService.deleteFile(user_id,title);
      res.json({ message: "File deleted successfully", id: result.id });
    } catch (error) {
      console.error("Error deleting File:", error);
      res.status(400).json({ error: (error as Error).message });
    }
  });

export default router;