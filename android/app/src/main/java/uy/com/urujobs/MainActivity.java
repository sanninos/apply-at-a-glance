package uy.com.urujobs;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

import android.webkit.JavascriptInterface;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends BridgeActivity {
    private static String fcmToken;
    private static android.webkit.WebView webView;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 1001;

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIFICATION_PERMISSION_REQUEST);
        } else {
            requestFcmToken();
        }
    }

    private void requestFcmToken() {
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful() || task.getResult() == null) {
                        return;
                    }
                    setFcmToken(task.getResult());
                });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST) {
            requestFcmToken();
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        webView = this.bridge.getWebView();
        webView.addJavascriptInterface(new FcmBridge(), "UrujobsPush");
    }

    static void setFcmToken(String token) {
        fcmToken = token;
        if (webView != null && token != null) {
            webView.post(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('urujobs:fcm-token',{detail:{token:" +
                            org.json.JSONObject.quote(token) + ",platform:'android'}}))",
                    null));
        }
    }

    static class FcmBridge {
        @JavascriptInterface
        public String getToken() {
            return fcmToken;
        }
    }
}
