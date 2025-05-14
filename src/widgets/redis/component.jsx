import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import { useTranslation } from "next-i18next";

import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;

  const { data: redisData, error: redisError } = useWidgetAPI(widget);

  if (redisError) {
    return <Container service={service} error={redisError} />;
  }

  if (!widget.fields) {
    widget.fields = ["connected_clients", "total_keys", "used_memory", "ops_per_second"];
  }

  if (!redisData) {
    return (
      <Container service={service}>
        <Block label="redis.connected_clients" />
        <Block label="redis.total_keys" />
        <Block label="redis.used_memory" />
        <Block label="redis.ops_per_second" />
      </Container>
    );
  }

  const fieldsToDisplay = widget.fields || [];

  return (
    <Container service={service}>
      {fieldsToDisplay.includes("connected_clients") && (
        <Block
          label="redis.connected_clients"
          value={t("common.number", { value: redisData.connected_clients })}
        />
      )}

      {fieldsToDisplay.includes("total_keys") && (
        <Block
          label="redis.total_keys"
          value={t("common.number", { value: redisData.total_keys })}
        />
      )}

      {fieldsToDisplay.includes("used_memory") && (
        <Block
          label="redis.used_memory"
          value={redisData.used_memory_human}
        />
      )}

      {fieldsToDisplay.includes("ops_per_second") && (
        <Block
          label="redis.ops_per_second"
          value={t("common.number", { value: redisData.ops_per_second })}
        />
      )}

      {fieldsToDisplay.includes("uptime_days") && (
        <Block
          label="redis.uptime_days"
          value={`${t("common.number", { value: redisData.uptime_days })} ${t("common.days")}`}
        />
      )}

      {fieldsToDisplay.includes("version") && (
        <Block
          label="redis.version"
          value={redisData.version}
        />
      )}
    </Container>
  );
}