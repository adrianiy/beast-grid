import { DownloadIcon } from "@radix-ui/react-icons";
import { BeastGridConfig } from "../../common";

type Props<T> = {
  config: BeastGridConfig<T>;
};

export default function Toolbar<T>({ config }: Props<T>) {
  if (!config.toolbar) {
    return null;
  }

  const handleDownload = () => {
    console.log('download')
  }

  const Download = () => {
    if (!config.toolbar?.download) {
      return null;
    }

    return (
      <button onClick={handleDownload}>
        <DownloadIcon />
      </button>
    );
  }
  
  return (
    <div className="bg-toolbar">
      <div className="bg-toolbar__left">
      </div>
      <div className="bg-toolbar__right">
        <Download />
      </div>
    </div>
  );
}
