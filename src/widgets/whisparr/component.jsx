import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";
import { useCallback } from "react";

import QueueEntry from "../../components/widgets/queue/queueEntry";

import useWidgetAPI from "utils/proxy/use-widget-api";

function getProgress(sizeLeft, size) {
  return sizeLeft === 0 ? 100 : (1 - sizeLeft / size) * 100;
}

function getTitle(queueEntry, seriesData) {
  let title = "";
  const seriesTitle = seriesData.find((entry) => entry.id === queueEntry.seriesId)?.title;
  if (seriesTitle) title += `${seriesTitle}: `;
  const { episodeTitle } = queueEntry;
  if (episodeTitle) title += episodeTitle;
  if (title === "") return null;
  return title;
}

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;

  const { data: seriesData, error: seriesError } = useWidgetAPI(widget, "series");
  const { data: queuedData, error: queuedError } = useWidgetAPI(widget, "queue/status");
  const { data: queueDetailsData, error: queueDetailsError } = useWidgetAPI(widget, "queue/details");

  const formatDownloadState = useCallback((downloadState) => {
    switch (downloadState) {
      case "importPending":
        return "import pending";
      case "failedPending":
        return "failed pending";
      default:
        return downloadState;
    }
  }, []);

  if (seriesError || queuedError || queueDetailsError) {
    const finalError = seriesError ?? queuedError ?? queueDetailsError;
    return <Container service={service} error={finalError} />;
  }

  if (!seriesData || !queuedData || !queueDetailsData) {
    return (
      <Container service={service}>
        <Block label="whisparr.wanted" />
        <Block label="whisparr.missing" />
        <Block label="whisparr.queued" />
        <Block label="whisparr.scenes" />
      </Container>
    );
  }

  const enableQueue = widget?.enableQueue && Array.isArray(queueDetailsData) && queueDetailsData.length > 0;

  return (
    <>
      <Container service={service}>
        <Block label="whisparr.wanted" value={t("common.number", { value: seriesData.wanted })} />
        <Block label="whisparr.missing" value={t("common.number", { value: seriesData.missing })} />
        <Block label="whisparr.queued" value={t("common.number", { value: queuedData.totalCount })} />
        <Block label="whisparr.scenes" value={t("common.number", { value: seriesData.have })} />
      </Container>
      {enableQueue &&
        queueDetailsData.map((queueEntry) => (
          <QueueEntry
            progress={getProgress(queueEntry.sizeLeft, queueEntry.size)}
            timeLeft={queueEntry.timeLeft}
            title={getTitle(queueEntry, seriesData.all) ?? t("whisparr.unknown")}
            activity={formatDownloadState(queueEntry.trackedDownloadState)}
            key={`${queueEntry.seriesId}-${queueEntry.episodeId}`}
          />
        ))}
    </>
  );
}