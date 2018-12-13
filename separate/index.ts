import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

const appName = "nginx";

// The PVC to attach to nginx
const pvc = new k8s.core.v1.PersistentVolumeClaim(`${appName}-pvc`, {
	metadata: {
		name: appName,
		annotations: {
			"volume.beta.kubernetes.io/storage-class": `${ "standard" }`
		},
	},
	spec: {
		accessModes: ["ReadWriteOnce"],
		resources: {
			requests: {
				storage: "5Gi",
			},
		},
	},
});
const pvcName = pvc.metadata.apply(m => m.name);

// nginx Deployment
const appLabels = { app: appName };
const nginx = new k8s.apps.v1beta1.Deployment(appName, {
	spec: {
		selector: { matchLabels: appLabels },
		replicas: 1,
		template: {
			metadata: { labels: appLabels },
			spec: { 
				containers: [
					{
						name: appName,
						image: "nginx:1.15-alpine",
						volumeMounts: [{ name: "nginx-pv", mountPath: "/opt/nginx" }]
					}
				],
				volumes: [{ name: "nginx-pv", persistentVolumeClaim: { claimName: pvcName } }]
			}
		}
	}
});

// Export the app deployment name
export let nginxDeployment = nginx.metadata.apply(m => m.name);
