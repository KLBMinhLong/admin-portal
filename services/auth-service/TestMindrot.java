import org.mindrot.jbcrypt.BCrypt;
public class TestMindrot {
    public static void main(String[] args) {
        boolean match = BCrypt.checkpw("SecurePass@1234", "$2a$12$h8PklBj9QVsPlmp2DZYRWOzETIVP4FlrgD95xXQ1xNoSE80kbV4/m");
        System.out.println("Match: " + match);
    }
}
