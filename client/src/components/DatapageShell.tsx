import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
  onAdd: () => void;
  children: ReactNode;
}

export default function DataPageShell({ title, description, icon, onAdd, children }: Props) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">{icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add {title.slice(0, -1).replace(/ie$/, "y")}
        </button>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
        {children}
      </motion.div>
    </div>
  );
}
