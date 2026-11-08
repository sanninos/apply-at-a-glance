package uy.com.urujobs;

import android.net.Uri;
import android.os.CancellationSignal;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "UrujobsGoogleAuth")
public class UrujobsGoogleAuthPlugin extends Plugin {
    private CancellationSignal cancellation;

    @PluginMethod
    public void signIn(PluginCall call) {
        String nonce = call.getString("hashedNonce");
        if (nonce == null || !nonce.matches("[a-f0-9]{64}")) {
            call.reject("Invalid nonce", "invalid_nonce");
            return;
        }
        getActivity().runOnUiThread(() -> {
            Uri page = Uri.parse(getBridge().getWebView().getUrl());
            if (!"https".equals(page.getScheme()) || !"apply-at-a-glance.lovable.app".equals(page.getHost())) {
                call.reject("Untrusted origin", "untrusted_origin");
                return;
            }
            if (cancellation != null) {
                call.reject("Sign-in already running", "busy");
                return;
            }
            try {
                GetSignInWithGoogleOption option = new GetSignInWithGoogleOption.Builder(
                        getContext().getString(R.string.google_web_client_id))
                        .setNonce(nonce).build();
                GetCredentialRequest request = new GetCredentialRequest.Builder()
                        .addCredentialOption(option).build();
                cancellation = new CancellationSignal();
                CredentialManager.create(getContext()).getCredentialAsync(
                        getActivity(), request, cancellation,
                        ContextCompat.getMainExecutor(getContext()),
                        new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                            @Override
                            public void onResult(GetCredentialResponse response) {
                                cancellation = null;
                                try {
                                    Credential credential = response.getCredential();
                                    if (!(credential instanceof CustomCredential) ||
                                            !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                                        call.reject("Unexpected credential", "invalid_credential");
                                        return;
                                    }
                                    GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(credential.getData());
                                    JSObject result = new JSObject();
                                    result.put("idToken", google.getIdToken());
                                    call.resolve(result);
                                } catch (Exception ignored) {
                                    call.reject("Unable to read Google credential", "invalid_credential");
                                }
                            }

                            @Override
                            public void onError(GetCredentialException error) {
                                cancellation = null;
                                call.reject("Google sign-in did not complete",
                                        error instanceof GetCredentialCancellationException ? "cancelled" : "google_unavailable");
                            }
                        });
            } catch (Exception ignored) {
                cancellation = null;
                call.reject("Unable to start Google sign-in", "google_unavailable");
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (cancellation != null) cancellation.cancel();
        cancellation = null;
    }
}