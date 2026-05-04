SHELL := /bin/bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c

# Image coordinates and deploy targets. Override on the command line:
#   make publish VERSION=0.1.2
#   make release  VERSION=0.1.2
PROJECT          ?= jenkins-189019
IMAGE_REPO       ?= eu.gcr.io/$(PROJECT)/eudi-wallet-compliance
VERSION          ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo dev)
PLATFORM         ?= linux/amd64
HELM_RELEASE     ?= eudiwc
HELM_NAMESPACE   ?= eudiwc
HELM_CHART       := deploy/helm/eudi-wallet-compliance

IMAGE            := $(IMAGE_REPO):$(VERSION)
IMAGE_LATEST     := $(IMAGE_REPO):latest

.PHONY: help
help:
	@echo "Targets:"
	@echo "  build      Build linux/amd64 image locally as $(IMAGE) (no push)"
	@echo "  publish    Build and push $(IMAGE) and $(IMAGE_LATEST) to the registry"
	@echo "  release    Helm upgrade --install with image.tag=$(VERSION) into ns/$(HELM_NAMESPACE)"
	@echo "  deploy     publish + release"
	@echo "  rollout    Wait for the web Deployment rollout to complete"
	@echo "  status     Show pods, services and ingress in the namespace"
	@echo "  logs       Tail logs from the web Deployment"
	@echo "  uninstall  Helm uninstall (keeps the namespace and the OAuth secret)"
	@echo ""
	@echo "Variables: VERSION=$(VERSION) IMAGE_REPO=$(IMAGE_REPO) HELM_NAMESPACE=$(HELM_NAMESPACE)"

.PHONY: docker-login
docker-login:
	gcloud auth configure-docker eu.gcr.io --quiet

.PHONY: build
build:
	docker buildx build \
		--platform $(PLATFORM) \
		--tag $(IMAGE) \
		--load \
		.

.PHONY: publish
publish: docker-login
	docker buildx build \
		--platform $(PLATFORM) \
		--tag $(IMAGE) \
		--tag $(IMAGE_LATEST) \
		--push \
		.

.PHONY: release
release:
	helm upgrade --install $(HELM_RELEASE) $(HELM_CHART) \
		--namespace $(HELM_NAMESPACE) \
		--set image.repository=$(IMAGE_REPO) \
		--set image.tag=$(VERSION)

.PHONY: deploy
deploy: publish release rollout

.PHONY: rollout
rollout:
	kubectl -n $(HELM_NAMESPACE) rollout status deploy/$(HELM_RELEASE)-eudi-wallet-compliance --timeout=180s
	kubectl -n $(HELM_NAMESPACE) rollout status deploy/$(HELM_RELEASE)-eudi-wallet-compliance-oauth2-proxy --timeout=180s

.PHONY: status
status:
	kubectl -n $(HELM_NAMESPACE) get pods,svc,ingress

.PHONY: logs
logs:
	kubectl -n $(HELM_NAMESPACE) logs -l app.kubernetes.io/name=eudi-wallet-compliance -f --tail=100

.PHONY: uninstall
uninstall:
	helm uninstall $(HELM_RELEASE) -n $(HELM_NAMESPACE)
