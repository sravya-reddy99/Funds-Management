import express, { Request, Response } from "express";
import cors from "cors";
import { FundsRepo } from "./repo/fundsRepo";
import { parseListQuery } from "./repo/query";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const repo = new FundsRepo();

app.get("/", (req: Request, res: Response) => {
  res.send("Funds API is running");
});

/**
 * GET all items
 */
app.get("/api/funds", async (req: Request, res: Response) => {
  try {
    const query = parseListQuery(req.query);
    const items = await repo.list(query);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? "Server error" });
  }
});

/**
 * GET single item
 */
app.get("/api/funds/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await repo.getById(req.params.id);

    if (!item) {
      res.status(404).json({ message: "Fund not found" });
      return;
    }

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? "Server error" });
  }
});


/**
 * UPDATE single item
 */
app.put("/api/funds/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await repo.update(req.params.id, req.body);

    if (!updated) {
      res.status(404).json({ message: "Fund not found" });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err?.message ?? "Bad request" });
  }
});

/**
 * DELETE single item
 */
app.delete("/api/funds/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const ok = await repo.remove(req.params.id);

    if (!ok) {
      res.status(404).json({ message: "Fund not found" });
      return;
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err?.message ?? "Server error" });
  }
});

app.listen(port, async () => {
  await repo.ensureIds();
  console.log(`Server running at http://localhost:${port}`);
});