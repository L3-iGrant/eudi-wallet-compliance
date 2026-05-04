{{/*
Common labels and naming helpers.
*/}}

{{- define "eudiwc.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "eudiwc.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "eudiwc.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "eudiwc.labels" -}}
app.kubernetes.io/name: {{ include "eudiwc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "eudiwc.selectorLabels" -}}
app.kubernetes.io/name: {{ include "eudiwc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "eudiwc.oauth2ProxyName" -}}
{{ include "eudiwc.fullname" . }}-oauth2-proxy
{{- end -}}

{{- define "eudiwc.oauth2ProxySelectorLabels" -}}
app.kubernetes.io/name: {{ include "eudiwc.oauth2ProxyName" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
